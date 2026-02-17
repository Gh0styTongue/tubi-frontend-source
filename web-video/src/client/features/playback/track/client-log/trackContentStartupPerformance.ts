import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { type GET_FORMAT_RESOLUTION_TYPE } from 'common/features/playback/utils/getFormatResolution';
import { type VideoResource, type VIDEO_RESOURCE_RESOLUTION, VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto } from './utils/convertToProto';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { playerAnalyticsContentStartupPerformance } from '../analytics-ingestion-v3';

interface ContentStartupPerformanceParams {
  contentId: string;
  metrics: {
    [x: string]: number;
  };
  preloaded: boolean;
  videoResource?: VideoResource;
  startPosition: number;
  isAfterAd: boolean;
  isFromPreroll: boolean;
  currentVideoResolution: GET_FORMAT_RESOLUTION_TYPE;
}

export function trackContentStartupPerformance(
  {
    contentId,
    metrics,
    preloaded,
    videoResource,
    startPosition,
    isAfterAd,
    isFromPreroll,
    currentVideoResolution,
  }: ContentStartupPerformanceParams,
): void {
  const {
    first_frame_time,
    frag_loaded_time,
    variant_loaded_time,
    manifest_loaded_time,
    ...other_metrics
  } = metrics;
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: VODPlaybackSession.getVODPlaybackInfo().trackId,
    video_id: contentId,
    preloaded,
    is_after_ad: isAfterAd,
    is_from_preroll: isFromPreroll,
    start_position: Math.round(startPosition * 1000), // millisecond
    first_frame_time: Math.round(first_frame_time), // millisecond
    frag_loaded_time: Math.round(frag_loaded_time), // millisecond
    variant_loaded_time: Math.round(variant_loaded_time), // millisecond
    manifest_loaded_time: Math.round(manifest_loaded_time), // millisecond
    video_resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(videoResource?.type, 'unknown')],
    video_codec_type: VideoResourceCodecToProto[nullishCoalescingWrapper(videoResource?.codec, VIDEO_RESOURCE_CODEC.UNKNOWN)],
    max_video_resolution: VideoResolutionToProto[nullishCoalescingWrapper(videoResource?.resolution as GET_FORMAT_RESOLUTION_TYPE | VIDEO_RESOURCE_RESOLUTION, 'UNKNOWN')],
    current_video_resolution: VideoResolutionToProto[currentVideoResolution],
    message_map: convertObjectValueToString({
      hdcp: videoResource?.license_server?.hdcp_version,
      metrics: other_metrics,
    }),
  };
  playerAnalyticsContentStartupPerformance(playerAnalyticsData);
}
