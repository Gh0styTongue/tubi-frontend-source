import { type GET_FORMAT_RESOLUTION_TYPE } from '@adrise/utils/lib/getFormatResolution';
import { now } from '@adrise/utils/lib/time';
import { getArrayLastItem } from '@adrise/utils/lib/tools';

import { VODPlaybackSession } from 'client/features/playback/session/VODPlaybackSession';
import { type VIDEO_RESOURCE_RESOLUTION, VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { playerAnalyticsFallback } from '../analytics-ingestion-v3';
import { trackVideoFallbackMetrics } from '../datadog';
import { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto, HDCPVersionToProto } from './utils/convertToProto';
import { getFallbackMessageFromVideoResources } from './utils/getFallbackMessageFromVideoResources';
import type { VideoResourceFallbackParams } from './utils/types';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';

export function trackFallback(fallbackType: 'DRM' | 'CODEC', { contentId, reason, ...videoResources }: VideoResourceFallbackParams): void {
  const playbackInfo = VODPlaybackSession.getVODPlaybackInfo();
  const { startLoadTs } = playbackInfo;
  let failedDuration;
  const startTs = getArrayLastItem(startLoadTs);
  if (startTs) {
    failedDuration = (now() - Number(startTs)).toFixed(2);
  }
  const fallbackData = getFallbackMessageFromVideoResources(videoResources);
  const playerAnalyticsData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: playbackInfo.trackId,
    video_id: contentId,
    type: fallbackType,
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
    message_map: convertObjectValueToString({
      failed_duration: failedDuration,
      tvt: VODPlaybackSession.getInstance().updateViewTime().tvt * 1000,
      fallback_index: playbackInfo.fallbackCount,
      reason,
    }),
  };
  playerAnalyticsFallback(playerAnalyticsData);
  trackVideoFallbackMetrics();
}
