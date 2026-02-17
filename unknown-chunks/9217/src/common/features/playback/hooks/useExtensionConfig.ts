import type Hls from '@adrise/hls.js';
import type { ExtensionConfig, HlsExtensionConfig } from '@adrise/player';

import OTTFireTVDetachHlsDuringAdsPhase2 from 'common/experiments/config/ottFireTVDetachHlsDuringAdsPhase2';
import OTTFireTVLevelFragFastFail from 'common/experiments/config/ottFireTVLevelFragFastFail';
import OTTFireTVProgressiveFetch, { getConfigDetailFromMode } from 'common/experiments/config/ottFireTVProgressiveFetch';
import OTTLGTVIncreaseStallDurationOnLowChromeVersion from 'common/experiments/config/ottLGTVIncreaseStallDurationOnLowChromeVersion';
import OTTMultiplePlatformsDecreasePrerollBufferStall from 'common/experiments/config/ottMultiplePlatformsDecreasePrerollBufferStall';
import OTTVizioDetachHlsDuringAdsPhase2 from 'common/experiments/config/ottVizioDetachHlsDuringAdsPhase2';
import useExperiment from 'common/hooks/useExperiment';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { VideoResource } from 'common/types/video';
import { isSamsung2017Or2018 } from 'common/utils/tizenTools';

import { getPlayerExtensionConfig } from '../utils/getPlayerExtensionConfig';
import { getVideoProps } from '../utils/getVideoProps';
import type { VideoProps } from '../utils/getVideoProps';

export interface UseExtensionConfigProps {
  videoResource?: VideoResource;
  getVideoResource?: () => VideoResource | undefined;
  trailerId?: string | number;
  videoPreviewUrl?: string;
  useHlsNext?: boolean;
  forceHlsJS?: boolean;
  hlsInstance?: Hls;
  resumePos?: number;
  defaultBandWidthEstimate?: number;
  enableFrontBufferFlush?: boolean;
}

// this config is set to hls.js. And -1 could be the default config value of hls.js config https://github.com/video-dev/hls.js/blob/02e57367370c70fa1840a5e9b3c9faa87143cc0a/src/config.ts#L337
const DEFAULT_HLS_CONFIG_START_POSITION = -1;

function useRevertSegmentsCacheDuration(): number | undefined {
  let revertSegmentsCacheDuration: number | undefined;

  const ottFireTVDetachHlsDuringAdsPhase2 = useExperiment(OTTFireTVDetachHlsDuringAdsPhase2);
  const ottVizioDetachHlsDuringAdsPhase2 = useExperiment(OTTVizioDetachHlsDuringAdsPhase2);

  /* istanbul ignore if */
  if (ottVizioDetachHlsDuringAdsPhase2.getValue()) {
    revertSegmentsCacheDuration = 10;
  }

  const firetvCacheDuration = ottFireTVDetachHlsDuringAdsPhase2.getValue();
  /* istanbul ignore if */
  if (firetvCacheDuration) {
    revertSegmentsCacheDuration = firetvCacheDuration;
  }
  return revertSegmentsCacheDuration;
}

function useExtensionConfig(props: UseExtensionConfigProps): ExtensionConfig {
  const {
    videoResource,
    trailerId,
    videoPreviewUrl,
    useHlsNext,
    forceHlsJS,
    hlsInstance,
    resumePos,
    defaultBandWidthEstimate,
  } = props;
  const resource = videoResource;

  const isTrailer = !!(trailerId || typeof trailerId === 'number');
  const isVideoPreview = !!videoPreviewUrl;

  const mediaProps: VideoProps = getVideoProps(resource);
  const { hdcpVersion } = mediaProps;
  const isDrmContent = !isTrailer && !isVideoPreview && !!(mediaProps.licenseUrl);

  const ottFireTVProgressiveFetch = useExperiment(OTTFireTVProgressiveFetch);
  const ottFireTVLevelFragFastFail = useExperiment(OTTFireTVLevelFragFastFail);
  const ottMultiplePlatformsDecreasePrerollBufferStall = useExperiment(OTTMultiplePlatformsDecreasePrerollBufferStall);
  const ottLGTVIncreaseStallDurationOnLowChromeVersion = useExperiment(OTTLGTVIncreaseStallDurationOnLowChromeVersion);

  const progressiveMode = ottFireTVProgressiveFetch.getValue();
  const fastFailLevelFrag = ottFireTVLevelFragFastFail.getValue();
  const {
    progressive,
    progressiveAppendMp4,
    progressiveFastSpeedEnable,
    progressiveStartedUpSeekingEnable,
    progressiveUseDetachedLoader,
    progressiveFastSpeedFactor,
  } = getConfigDetailFromMode(progressiveMode);

  const revertSegmentsCacheDuration = useRevertSegmentsCacheDuration();
  const shouldReportBufferChange = isVideoPreview || FeatureSwitchManager.isEnabled(['Player', 'Info']);

  const startPosition = (resumePos && resumePos > 0) ? resumePos : DEFAULT_HLS_CONFIG_START_POSITION;

  const extensionConfig: ExtensionConfig = getPlayerExtensionConfig({
    isDrmContent,
    hdcpVersion,
    useHlsNext,
    forceHlsJS,
    progressive,
    progressiveAppendMp4,
    progressiveFastSpeedEnable,
    progressiveStartedUpSeekingEnable,
    progressiveUseDetachedLoader,
    progressiveFastSpeedFactor,
    fastFailLevelFrag,
    revertSegmentsCacheDuration,
    hlsInstance,
    shouldReportBufferChange,
    startPosition,
    enableWorker: isSamsung2017Or2018(),
    stallMinimumDurationMS: ottLGTVIncreaseStallDurationOnLowChromeVersion.enabled ? ottLGTVIncreaseStallDurationOnLowChromeVersion.getValue() : undefined,
    abrEwmaDefaultEstimate: defaultBandWidthEstimate,
  });

  if (ottMultiplePlatformsDecreasePrerollBufferStall.getValue()) {
    (extensionConfig as HlsExtensionConfig).relyOnAutoplayAttribute = true;
  }

  if (__OTTPLATFORM__ === 'PS4') {
    (extensionConfig as HlsExtensionConfig).enableFrontBufferFlush = true;
  }

  // for hls.js upgrade on PS4 and Samsung
  if (useHlsNext && (__OTTPLATFORM__ === 'PS4' || __OTTPLATFORM__ === 'TIZEN')) {
    (extensionConfig as HlsExtensionConfig).relyOnAutoplayAttribute = true;
  }

  return extensionConfig;
}

export default useExtensionConfig;
