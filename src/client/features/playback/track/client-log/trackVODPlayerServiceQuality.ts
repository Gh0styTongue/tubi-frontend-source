import { now } from '@adrise/utils/lib/time';
import { toFixed2 } from '@adrise/utils/lib/tools';

import { VODPlaybackSession, START_STEP } from 'client/features/playback/session/VODPlaybackSession';
import type { VODPlaybackInfo, PLAYBACK_SESSION_STARTUP_FAILURE_TYPE } from 'client/features/playback/session/VODPlaybackSession';
import { trackPlayerQosMetrics } from 'client/features/playback/track/datadog';
import { getStartStepString } from 'client/features/playback/utils/getStartStepString';
import { CUSTOM_TAGS } from 'common/constants/tracking-tags';
import { VIDEO_RESOURCE_CODEC } from 'common/types/video';
import { convertObjectValueToString } from 'common/utils/format';
import { nullishCoalescingWrapper } from 'common/utils/nullishCoalescingWrapper';

import { playerAnalyticsVODServiceQuality } from '../analytics-ingestion-v3';
import { VideoResourceTypeToProto, VideoResourceCodecToProto, HDCPVersionToProto } from './utils/convertToProto';
import { getPlayerDisplayType } from './utils/getPlayerDisplayType';
import { PLAYER_ANALYTICS_EVENT_VERSION } from './utils/types';
import { getVODPageSession } from '../../session/VODPageSession';

const cdnTagWhitelist = ['fastly', 'cloudfront', 'akamai'];

function countAdStartup(adStartSteps: number[][], target: number): number {
  let total: number = 0;
  adStartSteps.forEach((stepList: number[]) => {
    stepList.forEach((step: number) => {
      if (step === target) total++;
    });
  });
  return total;
}

function sendDatadogMetrics(playbackInfo: VODPlaybackInfo) {
  const { startSteps } = playbackInfo;
  const metrics = {
    viewTime: playbackInfo.playbackViewTime,
    playFailure: playbackInfo.errorType > -1 ? 1 : 0,
    playBreakOff: playbackInfo.breakOffCount > 0 ? 1 : 0,
    startupFailure: (playbackInfo.contentFirstFrameDuration === -1 && !playbackInfo.isAd) ? 1 : 0,
    contentFirstFrameDuration: toFixed2(playbackInfo.contentFirstFrameDuration),
    resumeFailureAfterMidroll: (startSteps.length > 1 && startSteps[startSteps.length - 1] < 2) ? 1 : 0,
    resumeCount: startSteps.length > 0 ? startSteps.length - 1 : 0,
    bufferingCount: playbackInfo.bufferingCount,
    bufferingDuration: toFixed2(playbackInfo.totalBufferingDuration),
    seekCount: playbackInfo.seekCount,
    seekDuration: toFixed2(playbackInfo.totalSeekDuration),
    resumeFirstFrameDuration: toFixed2(playbackInfo.totalContentResumeFirstFrameDuration),
    adCount: playbackInfo.adCount,
    adViewTime: playbackInfo.adPlaybackViewTime,
    adNotStartupCount: countAdStartup(playbackInfo.adStartSteps, START_STEP.START_LOAD),
    adFirstFrameDuration: toFixed2(playbackInfo.totalAdFirstFrameDuration),
    bufferingAdCount: playbackInfo.bufferingAdCount,
    adBufferingDuration: toFixed2(playbackInfo.totalAdBufferingDuration),
    errorAdCount: playbackInfo.errorAdCount,
  };
  Object.keys(metrics).forEach(key => {
    if (key !== 'viewTime' && !(metrics[key as keyof typeof metrics] > 0)) { // report viewTime whether it is 0 or not, in formula count(viewTime) can be used as content plays count
      delete metrics[key as keyof typeof metrics];
    }
  });
  const tags: {
    [CUSTOM_TAGS.CDN]?: string;
  } | undefined = cdnTagWhitelist.includes(playbackInfo.cdn) ? { // only allow report cdn data in whitelist, to avoid extra expense
    [CUSTOM_TAGS.CDN]: playbackInfo.cdn,
  } : undefined;
  trackPlayerQosMetrics(metrics, tags);
}

export function trackVODPlayerServiceQuality(retrievedPlaybackInfo?: VODPlaybackInfo) {
  const playbackInfo = retrievedPlaybackInfo ?? VODPlaybackSession.getVODPlaybackInfo();
  const { startSteps, adStartSteps, adPodFetchData, networkFeatures } = playbackInfo;
  let playbackSessionStartupFailureType: PLAYBACK_SESSION_STARTUP_FAILURE_TYPE | undefined;
  if (playbackInfo.joinTime === -1) {
    playbackSessionStartupFailureType = playbackInfo.isAdPodFetching[0] ? 'AD_POD_REQUEST' :
      playbackInfo.isAd ? 'PREROLL' :
        startSteps.length > 0 ? 'CONTENT' :
          'UNKNOWN';
  }
  let reportNetworkFeatures = true;
  if (playbackInfo.abrLoggingData?.download_speed.length) {
    reportNetworkFeatures = false;
  }

  const { playbackSourceType } = getVODPageSession();

  const playerAnalyticsEventData = {
    log_version: PLAYER_ANALYTICS_EVENT_VERSION,
    track_id: playbackInfo.trackId,
    rc: startSteps.length > 0 ? startSteps.length - 1 : 0, // content resume count
    last_ss: getStartStepString(startSteps.length > 0 ? startSteps[startSteps.length - 1] : START_STEP.UNKNOWN),
    errc: playbackInfo.errorCode,
    first_errc: playbackInfo.firstErrorCode,
    boc: playbackInfo.breakOffCount,
    bc: playbackInfo.bufferingCount,
    sc: playbackInfo.seekCount,
    tvt: playbackInfo.playbackViewTime * 1000,
    ad_ac: playbackInfo.adCount,
    ad_sfc: countAdStartup(adStartSteps, START_STEP.START_LOAD), // ad startup failure count
    ad_eac: playbackInfo.errorAdCount,
    ad_bac: playbackInfo.bufferingAdCount,
    ad_tabd: Math.round(playbackInfo.totalAdBufferingDuration),
    ad_tvt: playbackInfo.adPlaybackViewTime * 1000,
    is_ad: playbackInfo.isAd,
    download_speed: playbackInfo.totalDownloadTimeConsuming > 0 ? toFixed2(playbackInfo.totalDownloadSize / playbackInfo.totalDownloadTimeConsuming) : 0, // kbps
    cdn: playbackInfo.cdn,
    content_id: playbackInfo.contentId,
    cffd: Math.round(playbackInfo.contentFirstFrameDuration),
    tbd: Math.round(playbackInfo.totalBufferingDuration),
    tsd: Math.round(playbackInfo.totalSeekDuration),
    tcrffd: Math.round(playbackInfo.totalContentResumeFirstFrameDuration),
    ad_taffd: Math.round(playbackInfo.totalAdFirstFrameDuration),
    resource_type: VideoResourceTypeToProto[nullishCoalescingWrapper(playbackInfo.resourceType, 'unknown')],
    codec: VideoResourceCodecToProto[nullishCoalescingWrapper(playbackInfo.codec, VIDEO_RESOURCE_CODEC.UNKNOWN)],
    hdcp: HDCPVersionToProto[nullishCoalescingWrapper(playbackInfo.hdcp, 'hdcp_unknown')],
    download_frag_bitrate: playbackInfo.totalDownloadFragDuration > 0 ? toFixed2(playbackInfo.totalDownloadSize / playbackInfo.totalDownloadFragDuration) : 0, // kbps
    ad_imp: JSON.stringify(playbackInfo.adImpressions),
    message_map: convertObjectValueToString({
      is_retrieved_log: !!retrievedPlaybackInfo || undefined,
      device_model: playbackInfo.deviceModel,
      manufacturer: playbackInfo.manufacturer,
      app_version: playbackInfo.appVersion,
      os: playbackInfo.os,
      os_version: playbackInfo.osVersion,
      browser_version: playbackInfo.browserVersion,
      is_mobile: playbackInfo.isMobile,
      sdk: playbackInfo.sdkInfo,
      is_autoplay: playbackInfo.isAutoplay,
      is_autoplay_upb: playbackInfo.isFromAutoPlayWhileUserPressedBack,
      is_autoplay_vcc: playbackInfo.isFromAutoPlayWhileVideoComplete,
      is_deeplink: playbackInfo.isDeeplink,
      is_series: playbackInfo.isSeries,
      psd: toFixed2(now() - playbackInfo.startTs), // playback session duration
      fc: playbackInfo.fallbackCount,
      rlc: playbackInfo.reloadCount,
      first_errt: playbackInfo.firstErrorType,
      errt: playbackInfo.errorType,
      ad_svc: countAdStartup(adStartSteps, START_STEP.VIEWED_FIRST_FRAME), // ad startup viewed first frame but freeze count
      is_pa: playbackInfo.isPreroll,
      features: playbackInfo.features,
      download_size: toFixed2(playbackInfo.totalDownloadSize), // kbits
      download_frag_duration: toFixed2(playbackInfo.totalDownloadFragDuration),
      decoded_frames: playbackInfo.totalVideoFrames,
      dropped_frames: playbackInfo.droppedVideoFrames,
      active_dropped_frames: playbackInfo.activeDroppedVideoFrames,
      pod_pc: adPodFetchData[0].totalCount,
      pod_pd: adPodFetchData[0].totalRequestDuration * 1000,
      pod_pec: adPodFetchData[0].errorCount,
      pod_mc: adPodFetchData[1].totalCount,
      pod_md: adPodFetchData[1].totalRequestDuration * 1000,
      pod_mec: adPodFetchData[1].errorCount,
      jt: toFixed2(playbackInfo.joinTime),
      pssft: playbackSessionStartupFailureType,
      resources: playbackInfo.videoResourceAttributes,
      nudge_count: playbackInfo.nudgeCount,
      nbc: playbackInfo.networkBufferingCount,
      tnbd: Math.round(playbackInfo.totalNetworkBufferingDuration),
      hdmi_rc: playbackInfo.hdmiReconnectedCount,
      tp_mean: toFixed2(networkFeatures.throughput.mean),
      ttfb_mean: toFixed2(networkFeatures.ttfb.mean),
      network_feature_records: reportNetworkFeatures ? networkFeatures.recordsCSV : undefined,
      bww_oc: playbackInfo.bwwOpenCount,
      bww_dc: playbackInfo.bwwDidConvert,
      ap_s: playbackInfo.autoplayShown,
      ap_n: playbackInfo.autoplayNavigated,
      ap_dc: playbackInfo.autoplayDeliberateConversion,
      ap_tc: playbackInfo.autoplayTimeoutConversion,
      ap_dcm: playbackInfo.autoplayDismissByClickMiniPlayer,
      ap_dcb: playbackInfo.autoplayDismissByPressBack,
      abr: playbackInfo.abrLoggingData,
      // Device classification data
      buffer_ratio_group_update: playbackInfo.bufferRatioGroupUpdate,
      player_type: getPlayerDisplayType(playbackInfo.playerDisplayMode),
      ...(playbackInfo.lastPlayerDisplayMode && {
        last_player_type: getPlayerDisplayType(playbackInfo.lastPlayerDisplayMode),
      }),
      ...(playbackInfo.lastDisplayModeTransitionTime && {
        lpttt: toFixed2(playbackInfo.lastDisplayModeTransitionTime),
      }),
      ...(playbackInfo.playerDisplayModeTransitionCount && {
        pttc: playbackInfo.playerDisplayModeTransitionCount,
      }),
      ...(playbackInfo.emeErrorContext && {
        eme_phase: playbackInfo.emeErrorContext.phase,
        eme_hmk: playbackInfo.emeErrorContext.hasMediaKeys,
        eme_tslpt: toFixed2(playbackInfo.emeErrorContext.timeSinceLastPhaseTransition ?? -1),
      }),
      ...(playbackInfo.segmentTimelineMisalignment && ({
        first_fragment_duration_diff: playbackInfo.firstFragDurationDiff,
      })),
      // total time we spent showing blank thumbnails, ms
      thmb_b_ms: playbackInfo.thumbnailsBlankMs,
      // total time thumbnail component was on scren, ms
      thmb_r_ms: playbackInfo.thumbnailComponentRenderedMs,
      source_type: playbackSourceType,
    }),
  };
  playerAnalyticsVODServiceQuality(playerAnalyticsEventData);

  sendDatadogMetrics(playbackInfo);

  VODPlaybackSession.getInstance().clearSnapshot();
}
