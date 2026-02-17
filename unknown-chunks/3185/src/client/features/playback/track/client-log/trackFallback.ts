import { now } from '@adrise/utils/lib/time';
import { getArrayLastItem } from '@adrise/utils/lib/tools';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { type GET_FORMAT_RESOLUTION_TYPE } from 'common/features/playback/utils/getFormatResolution';
import { type VIDEO_RESOURCE_RESOLUTION, VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';
import { trackLogging } from 'common/utils/track';

import { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto, HDCPVersionToProto } from './utils/convertToProto';
import { getFallbackMessageFromVideoResources } from './utils/getFallbackMessageFromVideoResources';
import type { VideoResourceFallbackParams } from './utils/types';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { playerAnalyticsFallback } from '../analytics-ingestion-v3';
import { trackVideoFallbackMetrics } from '../datadog';

export function trackFallback(fallbackType: 'DRM' | 'CODEC', { contentId, reason, ...videoResources }: VideoResourceFallbackParams): void {
  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const { startLoadTs } = playbackInfo;
  let failedDuration;
  const startTs = getArrayLastItem(startLoadTs);
  if (startTs) {
    failedDuration = (now() - Number(startTs)).toFixed(2);
  }
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: playbackInfo.trackId,
    video_id: contentId,
    type: fallbackType,
  };
  const fallbackData = getFallbackMessageFromVideoResources(videoResources);
  trackLogging({
    level: 'error',
    type: TRACK_LOGGING.videoLoad,
    subtype: LOG_SUB_TYPE.PLAYBACK.FALLBACK,
    message: {
      ...playerAnalyticsData,
      failed_duration: failedDuration,
      tvt: VODPlaybackSession.getInstance().updateViewTime().tvt * 1000,
      fallback_index: playbackInfo.fallbackCount,
      track_id: playbackInfo.trackId,
      reason,
      ...fallbackData,
    },
  });
  playerAnalyticsFallback({
    ...playerAnalyticsData,
    failed_video_resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(fallbackData.failed_video_resource_type, 'unknown')],
    failed_video_codec_type: VideoResourceCodecToProto[nullishCoalescingWrapper(fallbackData.failed_video_codec_type, VIDEO_RESOURCE_CODEC.UNKNOWN)],
    failed_hdcp_version: HDCPVersionToProto[nullishCoalescingWrapper(fallbackData.failed_hdcp_version, 'hdcp_unknown')],
    failed_max_video_resolution: VideoResolutionToProto[nullishCoalescingWrapper(fallbackData.failed_max_video_resolution as GET_FORMAT_RESOLUTION_TYPE | VIDEO_RESOURCE_RESOLUTION, 'UNKNOWN')],
    failed_url: fallbackData.failed_url,
    fallback_video_resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(fallbackData.fallback_video_resource_type, 'unknown')],
    fallback_video_codec_type: VideoResourceCodecToProto[nullishCoalescingWrapper(fallbackData.fallback_video_codec_type, VIDEO_RESOURCE_CODEC.UNKNOWN)],
    fallback_hdcp_version: HDCPVersionToProto[nullishCoalescingWrapper(fallbackData.fallback_hdcp_version, 'hdcp_unknown')],
    fallback_max_video_resolution: VideoResolutionToProto[nullishCoalescingWrapper(fallbackData.fallback_max_video_resolution as GET_FORMAT_RESOLUTION_TYPE | VIDEO_RESOURCE_RESOLUTION, 'UNKNOWN')],
    fallback_url: fallbackData.fallback_url,
  });
  trackVideoFallbackMetrics();
}
