import {
  type MuxJS,
  type ExperimentalConfig,
  type AD_STALL_AT_START_HANDLE_METHOD,
  type CustomPlaybackHandlerConstructor,
  type AD_HEALTH_OPTIONS,
  type PlayerConfig,
  AD_STALL_AT_START_MAX_RETRY,
  PlayerName,
} from '@adrise/player';
import type { AdPlayerOptions } from '@adrise/player/lib/utils/progressiveMp4AdPlayer';

import { getBridge } from 'client/utils/clientTools';
import { AVOID_FALSE_IMPRESSION_HEALTHSCORE_PLATFORMS, SKIP_BUFFER_HOLE_IN_ADVANCE_PLATFORMS, CACHE_FRAGMENTS_SECONDS, SEEK_END_BUFFER_LEVEL } from 'common/constants/constants';
import OTTFireTVNativeCaptionsCache from 'common/experiments/config/ottFireTVNativeCaptionsCache';
import { useExperiment as useExperimentV2, useExperimentUser } from 'common/experimentV2';
import { getPlatformHealthScoreExperiment } from 'common/experimentV2/configs/helpers/getPlatformHealthScoreExperiment';
import OTTFireTVEnableAdsWithNativePlayer, { MIN_FIRETV_APP_VERSION } from 'common/experimentV2/configs/ottFireTVEnableAdsWithNativePlayer';
import OTTPlayerFireTVUseHlsAds from 'common/experimentV2/configs/ottPlayerFireTVUseHlsAds';
import OTTPlayerIgnorePlayPromise from 'common/experimentV2/configs/ottPlayerIgnorePlayPromise';
import OTTPlayerSamsungUseHlsAds from 'common/experimentV2/configs/ottPlayerSamsungUseHlsAds';
import webottMajorCacheFragmentsBroadenRange from 'common/experimentV2/configs/webottMajorCacheFragmentsBroadenRange';
import webottMajorHlsJsTickInterval, { TICK_INTERVAL_VALUE, type TICK_INTERVAL_MODE } from 'common/experimentV2/configs/webottMajorHlsJsTickInterval';
import webottMajorPlatformsAbortRainmakerRequestExitPlayerV0 from 'common/experimentV2/configs/webottMajorPlatformsAbortRainmakerRequestExitPlayerV0';
import WebOTTMajorPlatformsRebufferingEndBufferLevel from 'common/experimentV2/configs/webottMajorPlatformsRebufferingEndBufferLevel';
import { webottMajorPlatformsSkipAdWithHealthscoreR3 } from 'common/experimentV2/configs/webottMajorPlatformsSkipAdWithHealthscoreR3';
import WebOTTMajorPlatformsStartupEndBufferLevel from 'common/experimentV2/configs/webottMajorPlatformsStartupEndBufferLevel';
import webottMajorResumeUseCacheLevel from 'common/experimentV2/configs/webottMajorResumeUseCacheLevel';
import { webottMajorsDiluteTimeEventV0 } from 'common/experimentV2/configs/webottMajorsDiluteTimeEventV0';
import webottMajorsUpdatePrerollRequestConfig, { PREROLL_REQUEST_CONFIG_OPTIONS } from 'common/experimentV2/configs/webottMajorsUpdatePrerollRequestConfig';
import type { PrerollRequestConfigVariant } from 'common/experimentV2/configs/webottMajorsUpdatePrerollRequestConfig';
import { webShowBufferingProgress } from 'common/experimentV2/configs/webShowBufferingProgress';
import experiment from 'common/experimentV2/experiment';
import ContentStartupStallDetection from 'common/features/playback/customPlaybackHandlers/ContentStartupStallDetection';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { skipAdWithHealthScoreSelector } from 'common/selectors/experiments/skipAdByHealthscoreSelector';
import { fireSelector } from 'common/selectors/fire';
import { useHlsSelector } from 'common/selectors/tizen';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { VideoResource } from 'common/types/video';
import { isAFTMMModel } from 'common/utils/device';
import { isSamsung2017Or2018 } from 'common/utils/tizenTools';
import { semverCompareTo } from 'common/utils/version';

import useDedicatedAdPlayer from './useDedicatedAdPlayer';
import CustomHLSLogger from '../customPlaybackHandlers/CustomHLSLogger';

// Helper to get native ad player bridge - only called on client side
const getNativeAdPlayerBridge = () => {
  if (__CLIENT__) {
    return getBridge({ debug: __DEBUG_BRIDGE__ });
  }
  return undefined;
};

export interface UseExperimentalProps {
  videoResource?: VideoResource;
  playerName?: PlayerConfig['playerName'];
}

function useShouldEnableDetachHlsDuringAds(props: UseExperimentalProps): boolean {
  const { videoResource } = props;
  const isH264AndHDCP_V1 = videoResource && videoResource.codec === 'H264' && videoResource.license_server?.hdcp_version === 'hdcp_v1';

  if (!FeatureSwitchManager.isDefault(['Player', 'detachHlsDuringAds'])) {
    return FeatureSwitchManager.isEnabled(['Player', 'detachHlsDuringAds']);
  }

  const isAFTMM = isAFTMMModel();
  if (!isAFTMM || !isH264AndHDCP_V1) {
    return __SHOULD_ENABLE_DETACH_HLS_DURING_ADS__;
  }

  return false;
}

function useSeekWithResumePosition(props: UseExperimentalProps): Pick<ExperimentalConfig, 'enableSeekWithResumePosition'| 'customPlaybackHandlers'> {
  const { videoResource } = props;
  const expConfig = {
    enableSeekWithResumePosition: false,
    customPlaybackHandlers: [],
  };
  if (isAFTMMModel() && videoResource) {
    updateFireTVEnableStartPositionOnAftmmConfig(videoResource, expConfig);
  }
  if (!FeatureSwitchManager.isDefault(['Player', 'seekWithResumePosition'])) {
    expConfig.enableSeekWithResumePosition = FeatureSwitchManager.isEnabled(['Player', 'seekWithResumePosition']);
  }
  return expConfig;
}

function updateFireTVEnableStartPositionOnAftmmConfig(
  videoResource: VideoResource,
  expConfig: Pick<ExperimentalConfig, 'enableSeekWithResumePosition' | 'customPlaybackHandlers'>): Pick<ExperimentalConfig, 'enableSeekWithResumePosition' | 'customPlaybackHandlers'> {
  const isH264AndHDCP_V1 = videoResource && videoResource.codec === 'H264' && videoResource.license_server?.hdcp_version === 'hdcp_v1';
  /* istanbul ignore else */
  if (isAFTMMModel() && isH264AndHDCP_V1) {
    expConfig.enableSeekWithResumePosition = true;
  }
  return expConfig;
}

export function updateAftmmConfig(
  videoResource: VideoResource,
  expConfig: Pick<ExperimentalConfig, 'enableHlsDetachDuringAds' | 'enableSeekWithResumePosition'>) {
  if (!isAFTMMModel()) {
    return;
  }
  const isH264AndHDCP_V1 = videoResource && videoResource.codec === 'H264' && videoResource.license_server?.hdcp_version === 'hdcp_v1';
  if (isH264AndHDCP_V1) {
    expConfig.enableHlsDetachDuringAds = false;
    expConfig.enableSeekWithResumePosition = true;
  } else {
    expConfig.enableHlsDetachDuringAds = true;
    expConfig.enableSeekWithResumePosition = false;
  }
}

const useAdStallAtStartHandlerConfig = (): {
  adStallAtStartHandleMethod: AD_STALL_AT_START_HANDLE_METHOD;
  adStallAtStartCheckTimeout: number;
} => {

  let adStallAtStartHandleMethod: AD_STALL_AT_START_HANDLE_METHOD = 'retry';
  let adStallAtStartCheckTimeout: number = 5_000;
  const useLongSkip = isSamsung2017Or2018();

  if (!FeatureSwitchManager.isDefault(['Player', 'AdStallAtStartRecovery'])) {
    adStallAtStartHandleMethod = FeatureSwitchManager.get(['Player', 'AdStallAtStartRecovery']) as AD_STALL_AT_START_HANDLE_METHOD;
  } else if (useLongSkip) {
    adStallAtStartHandleMethod = 'skip';
    adStallAtStartCheckTimeout = 30_000;
  }

  return {
    adStallAtStartHandleMethod,
    adStallAtStartCheckTimeout,
  };
};

function featureNeedsToImportMuxJs() {
  if (!FeatureSwitchManager.isDefault(['Ad', 'MockUrl'])) {
    const value = FeatureSwitchManager.get(['Ad', 'MockUrl']);
    return typeof value === 'string' && value.indexOf('Hls') !== -1;
  }
  return false;
}

function usePreInitExtension(): boolean {
  const enablePreInitExtension = false;

  return enablePreInitExtension;
}

function useRebufferingEndBufferLevel() {
  return useExperimentV2(WebOTTMajorPlatformsRebufferingEndBufferLevel, { disableExposureLog: true }).get('rebuffering_end_buffer_level_v4');
}

function useStartupEndBufferLevel() {
  return useExperimentV2(WebOTTMajorPlatformsStartupEndBufferLevel, { disableExposureLog: true }).get('startup_end_buffer_level_v3');
}

function usePrerollRequestConfig(): { timeout: number; retry: number } | undefined {
  const prerollRequestConfigValue = useExperimentV2(webottMajorsUpdatePrerollRequestConfig, { disableExposureLog: true }).get('config_v2');
  return PREROLL_REQUEST_CONFIG_OPTIONS[prerollRequestConfigValue as PrerollRequestConfigVariant];
}

function useFireTVNativePlayerConfig() {
  const fire = useAppSelector(fireSelector);
  const ottFireTVEnableAdsWithNativePlayer = useExperimentV2(OTTFireTVEnableAdsWithNativePlayer, { disableExposureLog: true });
  const matchMinVersion = __OTTPLATFORM__ === 'FIRETV_HYB' && semverCompareTo(fire?.appVersion?.semver || '', MIN_FIRETV_APP_VERSION) >= 0;
  const adsMode = ottFireTVEnableAdsWithNativePlayer.get('ads_mode');
  const featureSwitchAdsMode = FeatureSwitchManager.get(['Player', 'androidNativeAdsPlayer']);
  const effectiveAdsMode = typeof featureSwitchAdsMode === 'number' && featureSwitchAdsMode > 0
    ? featureSwitchAdsMode
    : (matchMinVersion ? adsMode : 0);

  const enableNativeAdPlayerBridge = effectiveAdsMode > 0 ? getNativeAdPlayerBridge() : undefined;
  const preloadNativeAds = effectiveAdsMode === 2;
  return { enableNativeAdPlayerBridge, preloadNativeAds };
}

function useSkipBufferHoleInAdvance() {
  return SKIP_BUFFER_HOLE_IN_ADVANCE_PLATFORMS.includes(__OTTPLATFORM__);
}

function useExperimentalConfig(props: UseExperimentalProps): ExperimentalConfig {
  const ottFireTVNativeCaptionsCache = useExperiment(OTTFireTVNativeCaptionsCache);
  const webottMajorsDiluteTimeEventV0Exp = useExperimentV2(webottMajorsDiluteTimeEventV0, { disableExposureLog: true });

  const enableHlsDetachDuringAds = useShouldEnableDetachHlsDuringAds(props);
  const adStallAtStartHandlerConfig = useAdStallAtStartHandlerConfig();

  const additionalFireTVEnableStartPositionOnAftmmConfig = useSeekWithResumePosition(props);

  const useNativeCpationsCache = ottFireTVNativeCaptionsCache.getValue();

  const customPlaybackHandlers: CustomPlaybackHandlerConstructor[] = [];

  if (__SHOULD_RECOVER_CONTENT_STARTUP_STALL__) {
    customPlaybackHandlers.push(ContentStartupStallDetection);
  }

  const skipBufferHoleInAdvance = useSkipBufferHoleInAdvance();

  const ottPlayerFireTVUseHlsAds = useExperimentV2(OTTPlayerFireTVUseHlsAds, { disableExposureLog: true }).get('use_hls_ads');
  const ottPlayerSamsungUseHlsAds = useExperimentV2(OTTPlayerSamsungUseHlsAds, { disableExposureLog: true }).get('use_hls_ads_preloading');
  const skipAdWithHealthScore = useAppSelector(skipAdWithHealthScoreSelector) as AD_HEALTH_OPTIONS;
  const tizenUseHlsAds = useAppSelector(useHlsSelector);
  const usingHlsAds = ottPlayerFireTVUseHlsAds || ottPlayerSamsungUseHlsAds || tizenUseHlsAds;

  const experimentUser = useExperimentUser();

  const ignorePlayInterruptErrorInAd = () => {
    return experiment.getExperiment(OTTPlayerIgnorePlayPromise, { user: experimentUser }).get('ignore_play_promise');
  };

  if (usingHlsAds) {
    // with HLS we do not retry if ad is stalled. this code maps the
    // retry into a skip. retrying is handled internally within the
    // hls ad player
    if (adStallAtStartHandlerConfig.adStallAtStartHandleMethod === 'retry') {
      adStallAtStartHandlerConfig.adStallAtStartHandleMethod = 'skip';
      // hls ad player retries internally, give it the total number of seconds that control
      // group would use with retry before considering it a stall
      adStallAtStartHandlerConfig.adStallAtStartCheckTimeout *= (AD_STALL_AT_START_MAX_RETRY + 1);
    }
  }

  const enablePreInitExtension = usePreInitExtension();
  /* istanbul ignore if */
  if (enablePreInitExtension) {
    customPlaybackHandlers.push(CustomHLSLogger);
  }
  const enableHlsCacheFragments = useDedicatedAdPlayer() ? CACHE_FRAGMENTS_SECONDS.DISABLE : CACHE_FRAGMENTS_SECONDS.ENABLE;
  const enableCacheFragmentsBroadenRange = useExperimentV2(webottMajorCacheFragmentsBroadenRange, { disableExposureLog: true }).get('enable_cache_fragments_broaden_range_v0');
  const enableResumeUseCacheLevel = useExperimentV2(webottMajorResumeUseCacheLevel, { disableExposureLog: true }).get('enable_resume_use_cache_level_v0');
  const tickIntervalMode = useExperimentV2(webottMajorHlsJsTickInterval, { disableExposureLog: true }).get('tick_interval_mode_v0');
  const tickIntervalValue = TICK_INTERVAL_VALUE[tickIntervalMode as TICK_INTERVAL_MODE];

  let impressionRequirement: AdPlayerOptions['impressionRequirement'] = (FeatureSwitchManager.get(['Player', 'ImpressionRequirement']) || 'none') as AdPlayerOptions['impressionRequirement'];

  let onlyRespectImpressionRequirementAfterCodeSkip = FeatureSwitchManager.isEnabled(['Player', 'onlyRespectImpressionRequirementAfterCodeSkip']);
  const disableAdStallSkipImpressionRequirement = false;

  if (
    skipAdWithHealthScore === 'error_or_healthscore'
    && AVOID_FALSE_IMPRESSION_HEALTHSCORE_PLATFORMS.includes(__OTTPLATFORM__)
  ) {
    // For health score experiment treatment group, we want to avoid false impression to revalidate the impression.
    impressionRequirement = 'non_zero';
    onlyRespectImpressionRequirementAfterCodeSkip = true;
  }

  // Set healthScoreThreshold based on platform-specific experiment
  const platformExperiment = getPlatformHealthScoreExperiment(__OTTPLATFORM__);
  // Always call hook, but use old experiment as fallback for platforms without specific one
  const experimentToUse = platformExperiment || webottMajorPlatformsSkipAdWithHealthscoreR3;
  const platformExperimentResult = useExperimentV2(experimentToUse, { disableExposureLog: true });
  const healthScoreThreshold = platformExperiment
    ? platformExperimentResult.get('healthscore_skip_threshold')
    : 0.6; // Default for platforms without specific experiment (AndroidTV, TIZEN, HISENSE, etc.)

  const abrRuleMode = __OTTPLATFORM__ === 'FIRETV_HYB' ? 1 : 0;
  const rebufferingEndBufferLevel = useRebufferingEndBufferLevel();
  const startupEndBufferLevel = useStartupEndBufferLevel();

  const { enableNativeAdPlayerBridge, preloadNativeAds } = useFireTVNativePlayerConfig();

  const useCustomLoader = useExperimentV2(webShowBufferingProgress, { disableExposureLog: true }).get('enable');

  const enableAbortRainmakerRequest = useExperimentV2(webottMajorPlatformsAbortRainmakerRequestExitPlayerV0, { disableExposureLog: true }).get('enable_abort');

  const prerollRequestConfig = usePrerollRequestConfig();

  const experimentalConfig: ExperimentalConfig = {
    enableHlsDetachDuringAds,
    useNativeCpationsCache,
    skipAdWithHealthScore,
    ...adStallAtStartHandlerConfig,
    ...additionalFireTVEnableStartPositionOnAftmmConfig,
    customPlaybackHandlers,
    removeLoadeddataEventToTriggerPlay: ['TIZEN', 'PS4'].includes(__OTTPLATFORM__),
    enablePreInitExtension,
    ignorePlayInterruptErrorInAd,
    impressionRequirement,
    onlyRespectImpressionRequirementAfterCodeSkip,
    disableAdStallSkipImpressionRequirement,
    enableHlsCacheFragments: enableNativeAdPlayerBridge ? 0 : enableHlsCacheFragments,
    enableCacheFragmentsBroadenRange,
    enableResumeUseCacheLevel,
    skipBufferHoleInAdvance,
    healthScoreThreshold,
    preventEarlyExitCheckInTimeupdateEvent: props.playerName === PlayerName.Preview,
    // firetv from the graduated popper experiment webott_firetv_complete_ads_stuck_near_end_v1
    endAdsNearEnd: __OTTPLATFORM__ === 'FIRETV_HYB' || usingHlsAds,
    abrRuleMode,
    hlsJsTickInterval: tickIntervalValue,
    seekEndBufferLevel: SEEK_END_BUFFER_LEVEL,
    startupEndBufferLevel,
    rebufferingEndBufferLevel,
    preloadAds: ottPlayerFireTVUseHlsAds || ottPlayerSamsungUseHlsAds,
    preloadNativeAds,
    enableNativeAdPlayerBridge,
    useCustomLoader,
    enableDiluteTimeEvent: props.playerName === PlayerName.VOD && webottMajorsDiluteTimeEventV0Exp.get('enable_dilute'),
    enableAbortRainmakerRequest,
    hlsAdsUseMp2t: ottPlayerFireTVUseHlsAds,
    prerollRequestConfig,
  };

  if (usingHlsAds ||
    featureNeedsToImportMuxJs()
  ) {
    // the health score experiments are designed for
    // use with progressive mp4. with hls we do
    // not need it enabled
    experimentalConfig.skipAdWithHealthScore = undefined;
    experimentalConfig.onlyRespectImpressionRequirementAfterCodeSkip = undefined;
    experimentalConfig.impressionRequirement = 'none';
    experimentalConfig.muxJS = () => import(/* webpackChunkName: "muxJS" */'mux.js/dist/mux-mp4.min') as unknown as Promise<MuxJS>;
  }

  return experimentalConfig;
}

export default useExperimentalConfig;
