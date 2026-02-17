import type Hls from '@adrise/hls.js';
import type { ExtensionConfig, HlsExtensionConfig } from '@adrise/player';
import { HLS_JS_LEVEL, isHlsExtensionConfig } from '@adrise/player';

import { getHlsPlatformSpecificProps, getOverrideWebWorkerConfig, getOverrideProgressiveFetchConfig, getOverrideBufferConfig } from 'client/features/playback/props/props';
import { PLAYER_STEP_SEEK_INTERVAL } from 'common/constants/player';
import { FLUSH_MODE } from 'common/experiments/config/ottFireTVEnableFrontBufferFlush';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { HDCPVersion } from 'common/types/video';

import { getHlsChunk } from './getHlsChunk';

export function getPlayerExtensionConfig({
  isDrmContent,
  hdcpVersion,
  useHlsNext = false,
  forceHlsJS,
  enableCapLevelOnFSPDrop = false,
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
  enableFrontBufferFlush = false,
  enableWorker,
  flushMode = FLUSH_MODE.CONTROL,
} : {
  isDrmContent?: boolean,
  hdcpVersion?: HDCPVersion,
  useHlsNext?: boolean,
  forceHlsJS?: boolean,
  enableCapLevelOnFSPDrop?: boolean,
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
  enableFrontBufferFlush?: boolean,
  enableWorker?: boolean,
  flushMode?: FLUSH_MODE,
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
      }),
      ...getOverrideWebWorkerConfig(),
      ...getOverrideBufferConfig(),
      ...getOverrideProgressiveFetchConfig(),
      ...(revertSegmentsCacheDuration !== undefined ? { revertSegmentsCacheDuration } : {}),
      // The config option frontBufferFlushThreshold is supported in hls@1.5.7
      // For hls@1.2.7, we'll use it in hlsForwardFlush.ts
      ...(enableFrontBufferFlush ? { frontBufferFlushThreshold: 2 * PLAYER_STEP_SEEK_INTERVAL } : {}),
      startPosition,
      ...(enableWorker ? { enableWorker } : {}),
      ...(flushMode === FLUSH_MODE.NEVER_FLUSH ? {
        frontBufferFlushThreshold: Infinity,
        backBufferLength: Infinity,
      } : {}),
      ...(flushMode === FLUSH_MODE.ENABLE_FRONT_AND_BACK_FLUSH ? {
        backBufferLength: 0.1, // equal to 0
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
            enableCapLevelOnFSPDrop,
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
        },
      };
    default:
      break;
  }

  return extensionConfig;
}
