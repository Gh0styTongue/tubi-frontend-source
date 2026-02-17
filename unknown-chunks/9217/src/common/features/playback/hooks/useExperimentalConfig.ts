import type { MuxJS, ExperimentalConfig, AD_NO_BUFFER_METHOD, CustomPlaybackHandlerConstructor, AD_HEALTH_OPTIONS } from '@adrise/player';

import OTTComcastHlsUpgrade from 'common/experiments/config/ottComcastHlsUpgrade';
import { MAX_LEVEL_RESOLUTION } from 'common/experiments/config/ottFireTVGate1080pResolution';
import OTTFireTVNativeCaptionsCache from 'common/experiments/config/ottFireTVNativeCaptionsCache';
import OTTFireTVResumeStartupBufferDataLength from 'common/experiments/config/ottFireTVResumeStartupBufferDataLength';
import OTTPlayerSamsungUseHlsAds from 'common/experiments/config/ottPlayerSamsungUseHlsAds';
import OTTPlayerSamsungUseHlsAdsNewer from 'common/experiments/config/ottPlayerSamsungUseHlsAdsNewer';
import OTTVizioPreInitExtension from 'common/experiments/config/ottVizioPreInitExtension';
import WebAdAbnormalErrorConstrainView from 'common/experiments/config/webAdAbnormalErrorConstrainView';
import FireTVContentStartupStallDetection from 'common/features/playback/customPlaybackHandlers/FireTVContentStartupStallDetection';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { shouldLimitVideoResolutionSelector } from 'common/selectors/experiments/ottFireTVGate1080pResolutionSelectors';
import { skipAdWithHealthScoreSelector } from 'common/selectors/experiments/skipAdByHealthscoreSelector';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { VideoResource } from 'common/types/video';
import { isAFTMMModel } from 'common/utils/device';
import { isSamsung2017Or2018 } from 'common/utils/tizenTools';

import ComcastHLSLogger from '../customPlaybackHandlers/ComcastHLSLogger';

export interface UseExperimentalProps {
  videoResource?: VideoResource;
  useHlsNext?: boolean;
}

function useShouldEnableDetachHlsDuringAds(props: UseExperimentalProps): boolean {

  if (__OTTPLATFORM__ === 'PS4' || __OTTPLATFORM__ === 'TIZEN') {
    return !!props.useHlsNext;
  }

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

function featureNeedsToImportMuxJs() {
  if (!FeatureSwitchManager.isDefault(['Ad', 'MockUrl'])) {
    const value = FeatureSwitchManager.get(['Ad', 'MockUrl']);
    return typeof value === 'string' && value.indexOf('JsonSingleAd30sHls') !== -1;
  }
  return false;
}

function useResumeStartupBufferDataLength() {
  const result = useExperiment(OTTFireTVResumeStartupBufferDataLength).getValue();
  if (!FeatureSwitchManager.isDefault(['Player', 'ResumeStartupBufferDataLength'])) {
    return FeatureSwitchManager.get(['Player', 'ResumeStartupBufferDataLength']) as number;
  }
  return result;
}

function useExperimentalConfig(props: UseExperimentalProps): ExperimentalConfig {
  const ottFireTVNativeCaptionsCache = useExperiment(OTTFireTVNativeCaptionsCache);
  const skipAdWithHealthScore = useAppSelector(skipAdWithHealthScoreSelector) as AD_HEALTH_OPTIONS;

  const enableHlsDetachDuringAds = useShouldEnableDetachHlsDuringAds(props);
  const adNoBufferConfig = useAdNoBuffer();

  const ottVizioPreInitExtension = useExperiment(OTTVizioPreInitExtension);
  const minResumeStartupBufferDataLength = useResumeStartupBufferDataLength();
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
  const ottPlayerSamsungUseHlsAdsNewer = useExperiment(OTTPlayerSamsungUseHlsAdsNewer);

  if (ottPlayerSamsungUseHlsAdsNewer.getValue()) {
    adNoBufferConfig.adNoBufferMethod = 'skip';
    adNoBufferConfig.adNoBufferTimeout = 30_000;
  }

  const experimentalConfig: ExperimentalConfig = {
    adAbnormalErrorConstrainView,
    enableHlsDetachDuringAds,
    maxLevelResolution,
    useNativeCpationsCache,
    skipAdWithHealthScore,
    ...adNoBufferConfig,
    ...additionalFireTVEnableStartPositionOnAftmmConfig,
    customPlaybackHandlers,
    removeLoadeddataEventToTriggerPlay: ['TIZEN', 'PS4'].includes(__OTTPLATFORM__) && props.useHlsNext,
    enablePreInitExtension: ottVizioPreInitExtension.getValue(),
    minResumeStartupBufferDataLength,
  };

  if (ottPlayerSamsungUseHlsAds.getValue() || ottPlayerSamsungUseHlsAdsNewer.getValue() || featureNeedsToImportMuxJs()) {
    experimentalConfig.muxJS = () => import(/* webpackChunkName: "muxJS" */'mux.js/dist/mux-mp4.min') as unknown as Promise<MuxJS>;
  }

  return experimentalConfig;
}

export default useExperimentalConfig;
