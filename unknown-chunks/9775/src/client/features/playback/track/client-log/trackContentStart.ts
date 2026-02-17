import type { ContentStartData } from '@adrise/player/lib';

import { getVODPageSession } from 'client/features/playback/session/VODPageSession';
import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { type GET_FORMAT_RESOLUTION_TYPE } from 'common/features/playback/utils/getFormatResolution';
import { type VideoResource, type VIDEO_RESOURCE_RESOLUTION, VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';
import { trackLogging } from 'common/utils/track';

import { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto } from './utils/convertToProto';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { playerAnalyticsContentStart } from '../analytics-ingestion-v3';

export function trackContentStart({
  contentId,
  resumeFromAds,
  isFromPreroll,
  videoResource,
  position,
  currentVideoResolution,
}: {
  contentId: string;
  videoResource: VideoResource | undefined;
  currentVideoResolution: GET_FORMAT_RESOLUTION_TYPE;
} & ContentStartData) {
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    video_id: contentId,
    start_position: position * 1000, // millisecond
    is_after_ad: resumeFromAds,
    is_from_preroll: isFromPreroll,
    is_from_autoplay: getVODPageSession().autoplay,
  };
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.CONTENT_START,
    message: {
      ...playerAnalyticsData,
      video_resource_type: videoResource?.type,
      video_codec_type: videoResource?.codec,
      max_video_resolution: videoResource?.resolution,
      current_video_resolution: currentVideoResolution,
    },
  });
  playerAnalyticsContentStart({
    ...playerAnalyticsData,
    start_position: Math.round(position * 1000), // millisecond
    video_resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(videoResource?.type, 'unknown')],
    video_codec_type: VideoResourceCodecToProto[nullishCoalescingWrapper(videoResource?.codec, VIDEO_RESOURCE_CODEC.UNKNOWN)],
    max_video_resolution: VideoResolutionToProto[nullishCoalescingWrapper(videoResource?.resolution as GET_FORMAT_RESOLUTION_TYPE | VIDEO_RESOURCE_RESOLUTION, 'UNKNOWN')],
    current_video_resolution: VideoResolutionToProto[currentVideoResolution],
  });
}
