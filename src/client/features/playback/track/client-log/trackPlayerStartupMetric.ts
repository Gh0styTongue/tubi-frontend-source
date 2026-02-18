import { toFixed2 } from '@adrise/utils/lib/tools';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';
import { trackLogging } from 'common/utils/track';

import { VideoResourceTypeToProto, VideoResourceCodecToProto, HDCPVersionToProto } from './utils/convertToProto';
import { START_STEP } from '../../session/VODPlaybackSession';
import type { VODPlaybackInfo } from '../../session/VODPlaybackSession';
import { getStartStepString } from '../../utils/getStartStepString';

interface PlayerStartupMetricParams {
  playbackInfo: VODPlaybackInfo;
  timestamps: Record<string, number>;
}

/**
 * This function collects startup timestamp data from the PlayerStartupManager,
 * along with various playback details. The data is logged under a separate subtype
 * until we refine the data we want to collect.
 *
 * The goal is to eventually integrate and enhance the data currently reported
 * in analytics-ingestion-v3 by incorporating more detailed startup timestamps.
 * Metrics are calculated on the backend using these raw timestamps.
 */
export function trackPlayerStartupMetric({
  playbackInfo,
  timestamps: ts,
}: PlayerStartupMetricParams) {
  const {
    isAutoplay,
    isContinueWatching,
    isAd,
    isSeeking,
    isBuffering,
    isPreroll,
    isDeeplink,
    adCount,
    isRetrying,
    reloadCount,
    nudgeCount,
    totalDownloadSize,
    totalDownloadTimeConsuming,
    totalVideoFrames,
    droppedVideoFrames,
    fallbackCount,
    trackId,
    appVersion,
    resourceType,
    codec,
    hdcp,
    isMobile,
    deviceModel,
    manufacturer,
    os,
    osVersion,
    browserVersion,
    isSeries,
    sdkInfo,
    startSteps,
    videoResourceAttributes,
    contentId,
  } = playbackInfo;

  const lastStartStep = startSteps.length > 0 ? startSteps[startSteps.length - 1] : START_STEP.UNKNOWN;

  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.PLAYER_STARTUP_METRIC,
    message: {
      track_id: trackId,
      app_version: appVersion,
      is_autoplay: isAutoplay,
      is_deeplink: isDeeplink,
      is_continue_watching: isContinueWatching,
      is_ad: isAd,
      is_seeking: isSeeking,
      is_buffering: isBuffering,
      is_pa: isPreroll,
      ad_ac: adCount,
      is_retrying: isRetrying,
      rlc: reloadCount,
      nudge_count: nudgeCount,
      download_size: totalDownloadSize,
      download_speed: totalDownloadTimeConsuming > 0 ? toFixed2(totalDownloadSize / totalDownloadTimeConsuming) : 0,
      decoded_frames: totalVideoFrames,
      dropped_frames: droppedVideoFrames,
      fc: fallbackCount,
      resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(resourceType, 'unknown')],
      codec: VideoResourceCodecToProto[nullishCoalescingWrapper(codec, VIDEO_RESOURCE_CODEC.UNKNOWN)],
      hdcp: HDCPVersionToProto[nullishCoalescingWrapper(hdcp, 'hdcp_unknown')],
      last_ss: getStartStepString(lastStartStep),
      device_model: deviceModel,
      manufacturer,
      os,
      os_version: osVersion,
      browser_version: browserVersion,
      is_mobile: isMobile,
      is_series: isSeries,
      sdk: JSON.stringify(sdkInfo),
      resources: JSON.stringify(videoResourceAttributes),
      content_id: contentId,
      ts,
    },
  });
}
