import { secs } from '@adrise/utils/lib/time';
import { toFixed2 } from '@adrise/utils/lib/tools';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { getLiveVideoSession } from 'client/features/playback/session/LiveVideoSession';
import { getStartStepString } from 'client/features/playback/utils/getStartStepString';
import { CUSTOM_TAGS } from 'common/constants/tracking-tags';
import { LivePlayerState, type LivePlaybackQualityManager } from 'common/features/playback/services/LivePlaybackQualityManager';
import type { VideoResource } from 'common/types/video';
import { VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { playerAnalyticsLiveQualityOfServices } from '../analytics-ingestion-v3';
import { trackLivePlayerQosMetrics } from '../datadog';
import { VideoResourceTypeToProto, VideoResourceCodecToProto } from './utils/convertToProto';
import { getLivePlayerAnalyticsBaseInfo } from './utils/getLivePlayerAnalyticsBaseInfo';

const cdnTagWhitelist = ['fastly', 'cloudfront', 'akamai'];
export function trackLiveQualityOfServices({
  wrapper,
  contentId,
  videoPlayer,
  ssaiVersion,
  videoResource,
  liveServiceQualityManager,
}: {
  wrapper: LivePlayerWrapper,
  liveServiceQualityManager: LivePlaybackQualityManager,
  contentId: string,
  videoPlayer: PlayerDisplayMode,
  ssaiVersion: string,
  videoResource: VideoResource | undefined,
}) {
  const baseInfo = getLivePlayerAnalyticsBaseInfo({
    wrapper,
    contentId,
    videoPlayer,
    ssaiVersion,
  });

  // FIXME: remove this after the backend is updated
  delete baseInfo.video_id;
  const serviceQuality = liveServiceQualityManager.getQuality();
  const firstFrameViewed = serviceQuality?.stateNum != null && serviceQuality.stateNum >= LivePlayerState.FIRST_FRAME_VIEWED;
  const cdn = wrapper.getCDN();

  const analyticsMetrics = {
    cffd: serviceQuality?.firstFrameViewed,
    last_ss: getStartStepString(liveServiceQualityManager.getLastStartStep() || 0),
    errc: liveServiceQualityManager.getErrorCode(),
    first_errc: liveServiceQualityManager.getFirstErrorCode(),
    boc: liveServiceQualityManager.getBreakoffCount(),
    bc: serviceQuality?.totalBufferCount,
    tbd: serviceQuality?.totalBufferTime,
    tvt: serviceQuality?.totalViewTime,
    download_speed: wrapper.getDownloadSpeed(),
    download_frag_bitrate: wrapper.getFragDownloadBitrate(),
    cdn,
  };

  const datadogMetrics: Record<string, number | undefined> = {
    firstFrameViewed: Math.min(secs(30), Math.max(0, serviceQuality?.firstFrameViewed ?? 0)),
    breakoffCount: liveServiceQualityManager.getBreakoffCount(),
    totalBufferCount: Math.max(0, serviceQuality?.totalBufferCount ?? 0),
    totalBufferTime: Math.max(0, serviceQuality?.totalBufferTime ?? 0),
    totalViewTime: Math.max(0, serviceQuality?.totalViewTime ?? 0),
    downloadSpeed: toFixed2(Math.max(0, wrapper.getDownloadSpeed() ?? 0)),
    fragDownloadBitrate: toFixed2(Math.max(0, wrapper.getFragDownloadBitrate() ?? 0)),
    startupError: liveServiceQualityManager.getErrorCode() && !firstFrameViewed ? 1 : 0,
    inStreamError: liveServiceQualityManager.getErrorCode() && firstFrameViewed ? 1 : 0,
    rebufferedPlay: serviceQuality?.totalBufferCount && serviceQuality.totalBufferCount > 0 ? 1 : 0,
  };

  const playerAnalyticsData = {
    ...baseInfo,
    content_id: contentId,
    resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(videoResource?.type, 'unknown')],
    codec: VideoResourceCodecToProto[nullishCoalescingWrapper(videoResource?.codec, VIDEO_RESOURCE_CODEC.UNKNOWN)],
    ...analyticsMetrics,
    message_map: convertObjectValueToString({
      quality_metrics: serviceQuality,
      quality_feedback: getLiveVideoSession()?.qualityFeedback,
      quality_feedback_level: getLiveVideoSession()?.qualityLevelOnFeedback?.label,
      quality_toast_shown: getLiveVideoSession()?.qualityToastShown,
      quality_video_height_on_feedback: getLiveVideoSession()?.qualityVideoHeightOnFeedback,
      quality_level: wrapper.getQualityLevel()?.label,
      quality_level_height: wrapper.getQualityLevel()?.height,
    }),
  };

  playerAnalyticsLiveQualityOfServices(playerAnalyticsData);

  const numericMetrics: { [key: string]: number } = {};
  Object.entries(datadogMetrics).forEach(([key, value]) => {
    if (typeof value === 'number') {
      numericMetrics[key] = value;
    }
  });
  const cdnTag = cdnTagWhitelist.find(tag => cdn?.toLowerCase()?.includes(tag));

  if (cdnTag) {
    trackLivePlayerQosMetrics(numericMetrics, { [CUSTOM_TAGS.CDN]: cdnTag });
  } else {
    trackLivePlayerQosMetrics(numericMetrics);
  }
}
