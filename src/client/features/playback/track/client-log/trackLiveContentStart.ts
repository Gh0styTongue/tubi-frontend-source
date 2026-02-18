import { getFormatResolution } from '@adrise/utils/lib/getFormatResolution';
import type { GET_FORMAT_RESOLUTION_TYPE } from '@adrise/utils/lib/getFormatResolution';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import type { VideoResource, VIDEO_RESOURCE_RESOLUTION } from 'common/types/video';
import { VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { playerAnalyticsLiveContentStart } from '../analytics-ingestion-v3';
import { VideoResourceTypeToProto, VideoResourceCodecToProto, VideoResolutionToProto } from './utils/convertToProto';
import { getLivePlayerAnalyticsBaseInfo } from './utils/getLivePlayerAnalyticsBaseInfo';

export function trackLiveContentStart({
  wrapper,
  contentId,
  videoPlayer,
  ssaiVersion,
  videoResource,
}: {
  wrapper: LivePlayerWrapper,
  contentId: string,
  videoPlayer: PlayerDisplayMode,
  ssaiVersion: string,
  videoResource: VideoResource
}) {
  const baseInfo = getLivePlayerAnalyticsBaseInfo({
    wrapper,
    contentId,
    videoPlayer,
    ssaiVersion,
  });
  const { width: currentResolutionWidth = 0, height: currentResolutionHeight = 0 } = wrapper.getQualityLevel?.() ?? {};

  const playerAnalyticsData = {
    ...baseInfo,
    video_resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(videoResource?.type, 'unknown')],
    video_codec_type: VideoResourceCodecToProto[nullishCoalescingWrapper(videoResource?.codec, VIDEO_RESOURCE_CODEC.UNKNOWN)],
    max_video_resolution: VideoResolutionToProto[nullishCoalescingWrapper(videoResource?.resolution as GET_FORMAT_RESOLUTION_TYPE | VIDEO_RESOURCE_RESOLUTION, 'UNKNOWN')],
    current_video_resolution: VideoResolutionToProto[getFormatResolution(currentResolutionWidth, currentResolutionHeight)],
  };

  playerAnalyticsLiveContentStart(playerAnalyticsData);
}
