import { VideoResolutionType } from '@tubitv/analytics/lib/playerEvent';

import type { VideoContentResponse, VideoContentSeason, VideoContentVideo } from 'client/utils/clientDataRequest';
import type { Video, VideoMetadata, VideosResponseBody } from 'common/types/video';
import { VIDEO_RESOURCE_RESOLUTION } from 'common/types/video';

export const getIntCuePoint = (cuepoint: number): number => {
  return Math.round(cuepoint);
};

/**
 * Convert cue points from floats to integers.
 *
 * We are updating the cms content api from v1 to v2, and the v2 cue points are floats
 * the reason we are doing this is that player team would like to run an experiment later
 * when using float cue point values as it might have an impact on revenue.
 * convert property video.credit_cuepoints and video.monetization.cue_points
 */
export const formatVideoContentData = (video: VideoContentResponse) => {
  let roundCreditCuePoints: undefined | Video['credit_cuepoints'];
  let roundCuePoints: number[] = [];
  let childrens: VideoContentSeason[] = [];
  if (video.monetization?.cue_points) {
    roundCuePoints = video.monetization.cue_points.map(cp => getIntCuePoint(cp));
  }
  if (video.credit_cuepoints) {
    roundCreditCuePoints = {};
    for (const ccpKey of Object.keys(video.credit_cuepoints)) {
      roundCreditCuePoints[ccpKey] = getIntCuePoint(video.credit_cuepoints[ccpKey]);
    }
  }
  if (video.children?.length) {
    childrens = video.children.map((child: VideoContentSeason) => {
      const children = child.children?.map((cc: VideoContentResponse) => {
        return formatVideoContentData(cc) as VideoContentVideo;
      });
      return {
        ...child,
        children,
      };
    });
  }
  return {
    ...video,
    ...(childrens && childrens.length > 0 ? { children: childrens } : null),
    ...(roundCuePoints.length > 0 ? { monetization: { cue_points: roundCuePoints } } : null),
    credit_cuepoints: roundCreditCuePoints,
  };
};

export const formatVideosContentData = (videos: VideosResponseBody): VideosResponseBody => {
  const formattedVideos: VideosResponseBody = {};
  Object.keys(videos).forEach(videoId => {
    formattedVideos[videoId] = formatVideoContentData(videos[videoId]);
  });
  return formattedVideos;
};

export const formatVideosAutoPlayContentData = (videos: Video[]): Video[] => {
  const formattedVideos: Video[] = [];
  videos.forEach(item => {
    formattedVideos.push(formatVideoContentData(item));
  });
  return formattedVideos;
};

export const executeAfterMilliSeconds = (callback: () => void, milliSeconds: number): () => void => {
  const handler = setTimeout(callback, milliSeconds);
  return () => {
    clearTimeout(handler);
  };
};

export const processVideoResourceQuery = (query: Record<string, unknown>, qs: Record<string, unknown>) => {
  const { limit_resolutions, video_resources } = query;
  if (typeof limit_resolutions === 'string') {
    qs.limit_resolutions = [limit_resolutions];
  } else {
    qs.limit_resolutions = limit_resolutions;
  }

  if (typeof video_resources === 'string') {
    qs.video_resources = [video_resources];
  } else {
    qs.video_resources = video_resources;
  }
  return qs;
};

const RESOLUTIONS: Record<'4K' | '1080P', [VIDEO_RESOURCE_RESOLUTION, VideoResolutionType]> = {
  '4K': [VIDEO_RESOURCE_RESOLUTION.RES_4K, VideoResolutionType.VIDEO_RESOLUTION_2160P],
  '1080P': [VIDEO_RESOURCE_RESOLUTION.RES_1080P, VideoResolutionType.VIDEO_RESOLUTION_1080P],
};

const checkVideoResolution = (videoMetaData: VideoMetadata[], resolution: keyof typeof RESOLUTIONS): boolean => {
  return videoMetaData.some((metaData) =>
    RESOLUTIONS[resolution].includes(metaData.resolution.toUpperCase() as VIDEO_RESOURCE_RESOLUTION)
  );
};
// the content endpoint and homescreen endpoint return different video metadata
// VideoResolutionType | VIDEO_RESOURCE_RESOLUTION
export const isVideoResolution1080P = (videoMetaData: VideoMetadata[]): boolean => {
  return checkVideoResolution(videoMetaData, '1080P');
};

export const isVideoResolution4K = (videoMetaData: VideoMetadata[]): boolean => {
  return checkVideoResolution(videoMetaData, '4K');
};
