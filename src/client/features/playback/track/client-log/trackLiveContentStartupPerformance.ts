import type { PerformanceCollector } from '@adrise/player';
import { getFormatResolution } from '@adrise/utils/lib/getFormatResolution';
import type { GET_FORMAT_RESOLUTION_TYPE } from '@adrise/utils/lib/getFormatResolution';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { VideoResource, VIDEO_RESOURCE_RESOLUTION } from 'common/types/video';
import { VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { playerAnalyticsLiveContentStartupPerformance } from '../analytics-ingestion-v3';
import { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto } from './utils/convertToProto';
import { getLivePlayerAnalyticsBaseInfo } from './utils/getLivePlayerAnalyticsBaseInfo';

export function trackLiveContentStartupPerformance({
  wrapper,
  contentId,
  videoPlayer,
  ssaiVersion,
  videoResource,
  metrics,
}: {
  wrapper: LivePlayerWrapper,
  contentId: string,
  videoPlayer: PlayerDisplayMode,
  ssaiVersion: string,
  videoResource: VideoResource,
  metrics: PerformanceCollector['timeMap']
}) {
  const baseInfo = getLivePlayerAnalyticsBaseInfo({
    wrapper,
    contentId,
    videoPlayer,
    ssaiVersion,
  });

  const {
    manifest_loaded_time,
    variant_loaded_time,
    first_frame_time,
    frag_loaded_time,
    ...otherMetrics
  } = metrics;

  const { width: currentResolutionWidth = 0, height: currentResolutionHeight = 0 } = wrapper.getQualityLevel?.() ?? {};

  const playerAnalyticsData = {
    ...baseInfo,
    video_resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(videoResource?.type, 'unknown')],
    video_codec_type: VideoResourceCodecToProto[nullishCoalescingWrapper(videoResource?.codec, VIDEO_RESOURCE_CODEC.UNKNOWN)],
    max_video_resolution: VideoResolutionToProto[nullishCoalescingWrapper(videoResource?.resolution as GET_FORMAT_RESOLUTION_TYPE | VIDEO_RESOURCE_RESOLUTION, 'UNKNOWN')],
    current_video_resolution: VideoResolutionToProto[getFormatResolution(currentResolutionWidth, currentResolutionHeight)],
    manifest_loaded_time: Math.round(manifest_loaded_time),
    variant_loaded_time: Math.round(variant_loaded_time),
    first_frame_time: Math.round(first_frame_time),
    frag_loaded_time: Math.round(frag_loaded_time),
    message_map: convertObjectValueToString({
      metrics: otherMetrics,
    }),
  };

  playerAnalyticsLiveContentStartupPerformance(playerAnalyticsData);
}
