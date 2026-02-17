import type { MuxJS, ExperimentalConfig, AD_PRELOAD_METHOD, AD_NO_BUFFER_METHOD, CustomPlaybackHandlerConstructor, AD_HEALTH_OPTIONS } from '@adrise/player';

import OTTComcastHlsUpgrade from 'common/experiments/config/ottComcastHlsUpgrade';
import OTTFireTVAdPreload from 'common/experiments/config/ottFireTVAdPreload';
import { MAX_LEVEL_RESOLUTION } from 'common/experiments/config/ottFireTVGate1080pResolution';
import OTTFireTVNativeCaptionsCache from 'common/experiments/config/ottFireTVNativeCaptionsCache';
import OTTFireTVSkipAdWithHealthScore from 'common/experiments/config/ottFireTVSkipAdWithHealthscore';
import OTTLGTVIgnorePlayInterruptErrorInAds from 'common/experiments/config/ottLGTVIgnorePlayInterruptErrorInAds';
import OTTPlayerSamsungUseHlsAds from 'common/experiments/config/ottPlayerSamsungUseHlsAds';
import OTTSonyQueueImpressions from 'common/experiments/config/ottSonyQueueImpressions';
import WebAdAbnormalErrorConstrainView from 'common/experiments/config/webAdAbnormalErrorConstrainView';
import FireTVContentStartupStallDetection from 'common/features/playback/customPlaybackHandlers/FireTVContentStartupStallDetection';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { shouldLimitVideoResolutionSelector } from 'common/selectors/experiments/ottFireTVGate1080pResolutionSelectors';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { VideoResource } from 'common/types/video';
import { isAFTMMModel } from 'common/utils/device';
import { isSamsung2017Or2018 } from 'common/utils/tizenTools';

import ComcastHLSLogger from '../customPlaybackHandlers/ComcastHLSLogger';

export interface UseExperimentalProps {
  videoResource?: VideoResource;
}

function useShouldEnableDetachHlsDuringAds(): boolean {

  if (__CLIENT__) {
    const isAFTMM = isAFTMMModel();
    if (!isAFTMM) {
      return __SHOULD_ENABLE_DETACH_HLS_DURING_ADS__;
    }
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
  return expConfig;
}

export function updateFireTVEnableStartPositionOnAftmmConfig(
  videoResource: VideoResource,
  expConfig: Pick<ExperimentalConfig, 'enableSeekWithResumePosition' | 'customPlaybackHandlers'>): Pick<ExperimentalConfig, 'enableSeekWithResumePosition' | 'customPlaybackHandlers'> {
  const isH264AndHDCP_V1 = videoResource && videoResource.codec === 'H264' && videoResource.license_server?.hdcp_version === 'hdcp_v1';
  /* istanbul ignore else */
  if (isAFTMMModel() && isH264AndHDCP_V1) {
    expConfig.enableSeekWithResumePosition = true;
  }
  return expConfig;
}

const useAdPreloadMethod = (): {
  adPreloadMethod: AD_PRELOAD_METHOD;
  adPreloadTimeout: number;
  adPreloadFallbackImmediately: boolean;
} => {
  const adPreloadDefaultConfig: ReturnType<typeof useAdPreloadMethod> = {
    adPreloadMethod: 'control',
    adPreloadTimeout: 10000,
    adPreloadFallbackImmediately: false,
  };
  const ottFireTVAdPreload = useExperiment(OTTFireTVAdPreload);
  switch (__OTTPLATFORM__) {
    case 'FIRETV_HYB':
      return {
        ...adPreloadDefaultConfig,
        adPreloadMethod: ottFireTVAdPreload.getValue(),
      };
    default:
      return adPreloadDefaultConfig;
  }
};

const useAdNoBuffer = (): {
  adNoBufferMethod: AD_NO_BUFFER_METHOD;
  adNoBufferTimeout: number;
} => {
  let adNoBufferMethod: AD_NO_BUFFER_METHOD = 'retry';
  let adNoBufferTimeout: number = 5_000;
  const useLongSkip = isSamsung2017Or2018();
  if (!FeatureSwitchManager.isDefault(['Player', 'AdNoBufferRecovery'])) {
    adNoBufferMethod = FeatureSwitchManager.get(['Player', 'AdNoBufferRecovery']) as AD_NO_BUFFER_METHOD;
  } else if (useLongSkip) {
    adNoBufferMethod = 'skip';
    adNoBufferTimeout = 30_000;
  }
  return {
    adNoBufferMethod,
    adNoBufferTimeout,
  };
};

function useExperimentalConfig(props: UseExperimentalProps): ExperimentalConfig {
  const ottFireTVNativeCaptionsCache = useExperiment(OTTFireTVNativeCaptionsCache);
  const skipAdWithHealthScore = useExperiment(OTTFireTVSkipAdWithHealthScore).getValue() as unknown as AD_HEALTH_OPTIONS;
  const enableHlsDetachDuringAds = useShouldEnableDetachHlsDuringAds();
  const adPreloadConfig = useAdPreloadMethod();
  const adNoBufferConfig = useAdNoBuffer();
  if (adPreloadConfig.adPreloadMethod === 'control' && !FeatureSwitchManager.isDefault(['Player', 'PreloadAds'])) {
    adPreloadConfig.adPreloadMethod = FeatureSwitchManager.get(['Player', 'PreloadAds']) as AD_PRELOAD_METHOD;
  }
  const adAbnormalErrorConstrainView = useExperiment(WebAdAbnormalErrorConstrainView).getValue();
  const additionalFireTVEnableStartPositionOnAftmmConfig = useSeekWithResumePosition(props);

  const shouldLimitVideoResolution = useAppSelector(shouldLimitVideoResolutionSelector);
  const maxLevelResolution = shouldLimitVideoResolution ? MAX_LEVEL_RESOLUTION : undefined;

  const useNativeCpationsCache = ottFireTVNativeCaptionsCache.getValue();

  const enableComcastHlsUpgrade = useExperiment(OTTComcastHlsUpgrade).getValue();

  const customPlaybackHandlers: CustomPlaybackHandlerConstructor[] = enableComcastHlsUpgrade ? [ComcastHLSLogger] : [];
  if (__SHOULD_RECOVER_CONTENT_STARTUP_STALL__) {
    customPlaybackHandlers.push(FireTVContentStartupStallDetection);
  }

  const ottPlayerSamsungUseHlsAds = useExperiment(OTTPlayerSamsungUseHlsAds);

  const ottSonyQueueImpressions = useExperiment(OTTSonyQueueImpressions);
  const ottLGTVIgnoreInterruptErrorInAds = useExperiment(OTTLGTVIgnorePlayInterruptErrorInAds);

  const experimentalConfig: ExperimentalConfig = {
    adAbnormalErrorConstrainView,
    enableHlsDetachDuringAds,
    maxLevelResolution,
    useNativeCpationsCache,
    skipAdWithHealthScore,
    ...adNoBufferConfig,
    ...adPreloadConfig,
    ...additionalFireTVEnableStartPositionOnAftmmConfig,
    customPlaybackHandlers,
    useQueueImpressions: __OTTPLATFORM__ === 'PS4' || ottSonyQueueImpressions.getValue(),
    ignorePlayInterruptErrorInAd: FeatureSwitchManager.isEnabled(['Ad', 'IgnorePlayInterruptErr']) || ottLGTVIgnoreInterruptErrorInAds.getValue(),
  };

  if (ottPlayerSamsungUseHlsAds.getValue()) {
    experimentalConfig.muxJS = () => import(/* webpackChunkName: "muxJS" */'mux.js/dist/mux-mp4.min') as unknown as Promise<MuxJS>;
  }

  return experimentalConfig;
}

export default useExperimentalConfig;
