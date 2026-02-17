import type Hls from '@adrise/hls.js';
import type { ExtensionConfig, HlsExtensionConfig } from '@adrise/player';
import { HLS_JS_LEVEL, isHlsExtensionConfig } from '@adrise/player';

import { getHlsPlatformSpecificProps, getOverrideWebWorkerConfig, getOverrideProgressiveFetchConfig, getOverrideBufferConfig } from 'client/features/playback/props/props';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { HDCPVersion } from 'common/types/video';

import { getHlsChunk } from './getHlsChunk';

export function getPlayerExtensionConfig({
  isDrmContent,
  hdcpVersion,
  useHlsNext = false,
  forceHlsJS,
  revertSegmentsCacheDuration,
  progressive,
  progressiveAppendMp4,
  progressiveFastSpeedEnable,
  progressiveStartedUpSeekingEnable,
  progressiveUseDetachedLoader,
  progressiveFastSpeedFactor,
  hlsInstance,
  shouldReportBufferChange = false,
  startPosition,
  fastFailLevelFrag,
  enableWorker,
  stallMinimumDurationMS,
  abrEwmaDefaultEstimate,
} : {
  isDrmContent?: boolean,
  hdcpVersion?: HDCPVersion,
  useHlsNext?: boolean,
  forceHlsJS?: boolean,
  systemVersion?: string,
  deviceMemory?: number,
  enableHlsDetachDuringAds?: boolean,
  revertSegmentsCacheDuration?: number,
  progressive?: boolean,
  progressiveAppendMp4?: boolean,
  progressiveFastSpeedEnable?: boolean,
  progressiveStartedUpSeekingEnable?: boolean,
  progressiveUseDetachedLoader?: boolean,
  progressiveFastSpeedFactor?: number,
  hlsInstance?: Hls,
  shouldReportBufferChange?: boolean,
  startPosition?: number,
  fastFailLevelFrag?: boolean,
  enableWorker?: boolean,
  stallMinimumDurationMS?: number,
  abrEwmaDefaultEstimate?: number,
}): ExtensionConfig {
  const extensionConfig: ExtensionConfig = {
    shouldReportBufferChange,
  };

  if (__SHOULD_USE_HLS__ || forceHlsJS || FeatureSwitchManager.isEnabled(['Player', 'EnableHlsJS']) && !FeatureSwitchManager.isDisabled(['Player', 'EnableHlsJS'])) {
    (extensionConfig as HlsExtensionConfig).hls = {
      ...getHlsPlatformSpecificProps({
        useHlsNext,
        startLevel: HLS_JS_LEVEL.LOWEST,
        fastFailLevelFrag,
        stallMinimumDurationMS,
      }),
      ...getOverrideWebWorkerConfig(),
      ...getOverrideBufferConfig(),
      ...getOverrideProgressiveFetchConfig(),
      ...(revertSegmentsCacheDuration !== undefined ? { revertSegmentsCacheDuration } : {}),
      startPosition,
      ...(enableWorker ? { enableWorker } : {}),
      ...(abrEwmaDefaultEstimate ? {
        abrEwmaDefaultEstimate,
        startLevel: HLS_JS_LEVEL.AUTO,
        testBandwidth: false,
      } : {}),
    };
    (extensionConfig as HlsExtensionConfig).externalHlsResolver = getHlsChunk(useHlsNext)
      .then(({ default: ExternalHls }) => ExternalHls) as Promise<typeof Hls>;
    if (hlsInstance) {
      (extensionConfig as HlsExtensionConfig).hlsInstance = hlsInstance;
    }
  }

  switch (__OTTPLATFORM__) {
    // TODO migrate to __SHOULD_USE_HLS__ compiler variable once new player migration is done
    case 'COMCAST':
    case 'XBOXONE':
    case 'COX':
    case 'COMCASTHOSP':
    case 'ROGERS':
    case 'PS5':
    case 'PS4':
    case 'VIZIO':
    case 'LGTV':
    case 'NETGEM':
    case 'TIVO':
    case 'TIZEN': // For samsung, this would not take effect if it's not using hls.js
    case 'HISENSE':
      return extensionConfig;
    case 'FIRETV_HYB':
      return {
        ...extensionConfig,
        relyOnAutoplayAttribute: true,
        ...(hlsInstance !== undefined ? { hlsInstance } : {}),
        hls: {
          ...(isHlsExtensionConfig(extensionConfig) ? extensionConfig.hls : {}),
          ...getHlsPlatformSpecificProps({
            emeEnabled: isDrmContent,
            hdcpVersion,
            useHlsNext,
            progressive,
            progressiveAppendMp4,
            progressiveFastSpeedEnable,
            progressiveStartedUpSeekingEnable,
            progressiveUseDetachedLoader,
            progressiveFastSpeedFactor,
            fastFailLevelFrag,
            startLevel: HLS_JS_LEVEL.LOWEST,
          }),
          ...getOverrideWebWorkerConfig(),
          ...getOverrideBufferConfig(),
          ...getOverrideProgressiveFetchConfig(),
          ...(revertSegmentsCacheDuration !== undefined ? { revertSegmentsCacheDuration } : {}),
          ...(abrEwmaDefaultEstimate ? {
            abrEwmaDefaultEstimate,
            startLevel: HLS_JS_LEVEL.AUTO,
            testBandwidth: false,
          } : {}),
        },
      };
    default:
      break;
  }

  return extensionConfig;
}
