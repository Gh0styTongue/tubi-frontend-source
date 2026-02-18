import type { ExtensionConfig, HlsExtensionConfig } from '@adrise/player';
import { HLS_JS_LEVEL, isHlsExtensionConfig } from '@adrise/player';

import { getHlsPlatformSpecificProps, getOverrideWebWorkerConfig, getOverrideBufferConfig } from 'client/features/playback/props/props';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { HDCPVersion } from 'common/types/video';

export function getPlayerExtensionConfig({
  isDrmContent,
  hdcpVersion,
  forceHlsJS,
  revertSegmentsCacheDuration,
  shouldReportBufferChange = false,
  startPosition,
  enableWorker,
  abrEwmaDefaultEstimate,
  maxBufferLength,
  maxMaxBufferLength,
  deprecateFilterDrmKeySystemWithConfig,
  forceClearMediaKeysAfterDetached,
  maxLeadVideoFragLoadCountOverAudio,
} : {
  isDrmContent?: boolean,
  hdcpVersion?: HDCPVersion,
  forceHlsJS?: boolean,
  systemVersion?: string,
  deviceMemory?: number,
  enableHlsDetachDuringAds?: boolean,
  revertSegmentsCacheDuration?: number,
  shouldReportBufferChange?: boolean,
  startPosition?: number,
  enableWorker?: boolean,
  abrEwmaDefaultEstimate?: number,
  maxBufferLength?: number,
  maxMaxBufferLength?: number,
  deprecateFilterDrmKeySystemWithConfig?: boolean,
  forceClearMediaKeysAfterDetached?: boolean,
  maxLeadVideoFragLoadCountOverAudio?: number,
}): ExtensionConfig {
  const extensionConfig: ExtensionConfig = {
    shouldReportBufferChange,
  };

  if (__SHOULD_USE_HLS__ || forceHlsJS || FeatureSwitchManager.isEnabled(['Player', 'EnableHlsJS'])) {
    (extensionConfig as HlsExtensionConfig).hls = {
      ...getHlsPlatformSpecificProps({
        startLevel: HLS_JS_LEVEL.LOWEST,
        deprecateFilterDrmKeySystemWithConfig,
      }),
      ...getOverrideWebWorkerConfig(),
      ...getOverrideBufferConfig(),
      ...(revertSegmentsCacheDuration !== undefined ? { revertSegmentsCacheDuration } : {}),
      startPosition,
      ...(enableWorker ? { enableWorker } : {}),
      ...(abrEwmaDefaultEstimate ? {
        abrEwmaDefaultEstimate,
        startLevel: HLS_JS_LEVEL.AUTO,
        testBandwidth: false,
      } : {}),
      ...(maxLeadVideoFragLoadCountOverAudio !== undefined ? { maxLeadVideoFragLoadCountOverAudio } : {}),
    };
  }

  if (__OTTPLATFORM__ === 'FIRETV_HYB') {
    return {
      ...extensionConfig,
      relyOnAutoplayAttribute: true,
      hls: {
        ...(isHlsExtensionConfig(extensionConfig) ? extensionConfig.hls : {}),
        ...getHlsPlatformSpecificProps({
          emeEnabled: isDrmContent,
          hdcpVersion,
          startLevel: HLS_JS_LEVEL.LOWEST,
          forceClearMediaKeysAfterDetached,
        }),
        ...getOverrideWebWorkerConfig(),
        ...getOverrideBufferConfig(),
        ...(revertSegmentsCacheDuration !== undefined ? { revertSegmentsCacheDuration } : {}),
        ...(abrEwmaDefaultEstimate ? {
          abrEwmaDefaultEstimate,
          startLevel: HLS_JS_LEVEL.AUTO,
          testBandwidth: false,
        } : {}),
        ...(maxBufferLength !== undefined ? { maxBufferLength } : {}),
        ...(maxMaxBufferLength !== undefined ? { maxMaxBufferLength } : {}),
        ...(maxLeadVideoFragLoadCountOverAudio !== undefined ? { maxLeadVideoFragLoadCountOverAudio } : {}),
      },
    };
  }

  return extensionConfig;
}
