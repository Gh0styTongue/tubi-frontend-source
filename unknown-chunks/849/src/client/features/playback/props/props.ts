import type { HlsConfig } from '@adrise/hls.js';
import type { HlsConfig as HlsNextConfig } from '@adrise/hls.js-next';
import type { AdapterConfig, HLS_JS_LEVEL } from '@adrise/player';
import type { ValueOf } from 'ts-essentials';

import systemApi from 'client/systemApi';
import { isFireTVDevice, isFireTVGen1, isFireTVStickGen1, isHisense5659, isHisense6886 } from 'client/utils/clientTools';
import { DRM_ROBUSTNESS_RULE } from 'common/constants/player';
import { getConfigDetailFromMode } from 'common/experiments/config/ottFireTVProgressiveFetch';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { HDCPVersion } from 'common/types/video';
import { semverCompareTo, isValidSemver } from 'common/utils/version';

import { getBufferSizeFromBufferLength } from '../utils/getBufferSizeFromBufferLength';

/**
 * Utility to provide hls props which are specific to a platform.
 * Only add highBufferWatchdogPeriod to firetv, hisense and xboxone platforms.
 * The reason for doing this is because of the BUFFER_STALLED_ERROR that users
 * encounter in these platforms.
 */
export function getHlsPlatformSpecificProps({
  fastFailLevelFrag,
  emeEnabled = false,
  hdcpVersion,
  useHlsNext = false,
  enableCapLevelOnFSPDrop = false,
  enableCEA708Captions = false,
  progressive = false,
  progressiveAppendMp4 = false,
  progressiveFastSpeedEnable = false,
  progressiveStartedUpSeekingEnable = false,
  progressiveUseDetachedLoader = false,
  progressiveFastSpeedFactor = 1,
  startLevel,
}: {
  fastFailLevelFrag?: boolean,
  emeEnabled?: boolean,
  hdcpVersion?: HDCPVersion,
  useHlsNext?: boolean;
  enableCapLevelOnFSPDrop?: boolean;
  enableCEA708Captions?: boolean;
  progressive?: boolean
  progressiveAppendMp4?: boolean
  progressiveFastSpeedEnable?: boolean
  progressiveStartedUpSeekingEnable?: boolean
  progressiveUseDetachedLoader?: boolean
  progressiveFastSpeedFactor?: number;
  startLevel: ValueOf<typeof HLS_JS_LEVEL>;
}): Partial<HlsConfig & HlsNextConfig> {
  let platformSpecificProps: Partial<HlsConfig & HlsNextConfig> = {
    abrMaxWithRealBitrate: true,
    enableCEA708Captions,
    startLevel,
  };
  if (useHlsNext) {
    platformSpecificProps = {
      fragLoadPolicy: {
        default: {
          maxTimeToFirstByteMs: 20000,
          maxLoadTimeMs: 120000,
          timeoutRetry: {
            maxNumRetry: 6,
            retryDelayMs: 1000,
            maxRetryDelayMs: 64000,
          },
          errorRetry: {
            maxNumRetry: 6,
            retryDelayMs: 1000,
            maxRetryDelayMs: 64000,
          },
        },
      },
      ...platformSpecificProps,
    };
  }
  switch (__OTTPLATFORM__) {
    /**
     * HLS web worker breaks when webOS version <3.9.0
     * Note that systemVersion can sometimes be the string 'TV' or single
     * digits like '7', so we conservatively enable worker only when we are
     * _very_ confident in the webOS version.
     */
    case 'LGTV': {
      const systemVersion = systemApi.getSystemVersion?.();

      platformSpecificProps = {
        ...platformSpecificProps,
        enableWorker: !!systemVersion && isValidSemver(systemVersion) && semverCompareTo(systemVersion, '3.9.0') > 0,
        stallMinimumDurationMS: useHlsNext ? 550 : undefined,
      };
      break;
    }
    case 'FIRETV_HYB':
      platformSpecificProps = {
        ...platformSpecificProps,
        // Increase to 8s to avoid fatal BUFFER_STALLED_ERROR on devices with low network speed
        highBufferWatchdogPeriod: 8,
        progressive,
        progressiveAppendMp4,
        progressiveFastSpeedEnable,
        progressiveStartedUpSeekingEnable,
        progressiveUseDetachedLoader,
        progressiveFastSpeedFactor,
        ...(fastFailLevelFrag ? {
          levelLoadingMaxRetry: 2,
          levelLoadingRetryDelay: 500,
          fragLoadingMaxRetry: 2,
          fragLoadingRetryDelay: 500,
        } : {}),
      };
      if (emeEnabled && isFireTVDevice()) {
        // FireTV Gen 1 and Stick Gen 1 only work with Widevine L3, and we also use Widevine L3 for DRM w/o HDCP
        if ((isFireTVGen1() || isFireTVStickGen1()) || !hdcpVersion || hdcpVersion === 'hdcp_disabled') {
          platformSpecificProps.drmSystemOptions = {
            audioRobustness: 'SW_SECURE_CRYPTO',
            videoRobustness: 'SW_SECURE_CRYPTO',
          };
        } else {
          // All other FireTV devices work with Widevine L3/L1
          platformSpecificProps.drmSystemOptions = {
            audioRobustness: 'HW_SECURE_CRYPTO',
            videoRobustness: 'HW_SECURE_ALL',
          };

        }
      }
      if (enableCapLevelOnFSPDrop) {
        platformSpecificProps.capLevelOnFPSDrop = true;
        platformSpecificProps.fpsDroppedMonitoringThreshold = 0.61;
        platformSpecificProps.fpsDroppedMonitoringPeriod = 5000;
        platformSpecificProps.fpsDroppedMonitoringFramesRequire = 600;
      }
      break;
    case 'XBOXONE':
      // We find out that the Xbox one will get stalled if there is a small gap between the current time and the next buffer. So we don't allow frag look-up tolerance.
      platformSpecificProps = {
        ...platformSpecificProps,
        maxFragLookUpTolerance: 0,
        enableWorker: true,
      };
      if (useHlsNext) {
        // Our master playlist file contains wrong DRM setting on playready content
        // We use this config to prevent hls.js using this wrong setting and just follow the config we passed in
        // TODO: Remove it once the master playlist get fixed
        // Relate thread: https://tubi.slack.com/archives/C04BFCQU8/p1692691072786789
        platformSpecificProps.forceFilterDrmKeySystemWithConfig = true;

      }
      break;
    case 'COMCAST':
      platformSpecificProps = {
        ...platformSpecificProps,
        maxMaxBufferLength: 50,
      };
      if (useHlsNext) {
        platformSpecificProps.frontBufferFlushThreshold = 50;
      }
      break;
    case 'VIZIO':
    case 'HISENSE':
      platformSpecificProps = {
        ...platformSpecificProps,
        // Increase to 8s to avoid fatal BUFFER_STALLED_ERROR on devices with low network speed
        highBufferWatchdogPeriod: 8,
      };
      break;
    case 'PS4':
      platformSpecificProps = {
        ...platformSpecificProps,
        enableWorker: true,
        maxMaxBufferLength: 30,
        drmSystemOptions: {
          initDataTypes: ['cenc'],
          utfEncodingType: 'utf-8',
        },
      };
      break;
    case 'PS5':
      platformSpecificProps = {
        ...platformSpecificProps,
        drmSystemOptions: {
          distinctiveIdentifier: 'required',
          utfEncodingType: 'utf-8',
        },
      };
      /* istanbul ignore else */
      if (useHlsNext) {
        // playready config synced with xboxone above
        platformSpecificProps.forceFilterDrmKeySystemWithConfig = true;
      }
      break;
    case 'TIZEN':
      platformSpecificProps = {
        ...platformSpecificProps,
        drmSystemOptions: {
          utfEncodingType: 'utf-8',
        },
      };
      break;
    default:
      break;
  }

  switch (__WEBPLATFORM__) {
    case 'WEB':
    case 'WINDOWS':
      platformSpecificProps = {
        ...platformSpecificProps,
        drmSystemOptions: {
          audioRobustness: 'SW_SECURE_CRYPTO',
          videoRobustness: 'SW_SECURE_CRYPTO',
        },
        // Increase to 8s to avoid fatal BUFFER_STALLED_ERROR on devices with low network speed
        highBufferWatchdogPeriod: 8,
      };
      break;
    default:
      break;
  }

  // override the robustness rule
  const securityLevel = FeatureSwitchManager.get(['DRM', 'WidevineSecurityLevel']) as unknown as keyof typeof DRM_ROBUSTNESS_RULE;
  if (securityLevel && DRM_ROBUSTNESS_RULE[securityLevel]) {
    platformSpecificProps.drmSystemOptions = platformSpecificProps.drmSystemOptions ? {
      ...platformSpecificProps.drmSystemOptions,
      ...DRM_ROBUSTNESS_RULE[securityLevel],
    } : {
      ...DRM_ROBUSTNESS_RULE[securityLevel],
    };
  }

  if (FeatureSwitchManager.isEnabled(['Player', 'DRMUseConfigInManifestFile'])) {
    platformSpecificProps.forceFilterDrmKeySystemWithConfig = false;
  }

  // Fix this ticket: https://app.clubhouse.io/tubi/story/92840/the-same-frame-will-be-played-multi-times-after-several-seek-and-play-operation
  // Fix this ticket: https://app.clubhouse.io/tubi/story/110384/player-compatible-with-hisense-5659
  if (isHisense6886() || isHisense5659()) {
    platformSpecificProps = {
      ...platformSpecificProps,
      highBufferWatchdogPeriod: 8,
    };
  }

  /* istanbul ignore next */
  if (__CLIENT__ && (!__PRODUCTION__ || __IS_ALPHA_ENV__)) {
    /* istanbul ignore next */
    if (typeof window.Tubi?.customHlsConfig !== 'undefined') {
      /* istanbul ignore next */
      platformSpecificProps = {
        ...platformSpecificProps,
        ...window.Tubi.customHlsConfig,
      };
    }
  }
  return platformSpecificProps;
}

/**
 * Intended to be spread into HLS config props after any platform-specific
 * props. When the feature switch is default, does not return any config
 * for the worker.
 */
/* istanbul ignore next */
export function getOverrideWebWorkerConfig(): Partial<HlsConfig> {
  if (!FeatureSwitchManager.isDefault(['Player', 'USE_WEB_WORKER'])) {
    return { enableWorker: FeatureSwitchManager.isEnabled(['Player', 'USE_WEB_WORKER']) };
  }
  return {};
}

/**
 * Intended to be spread into HLS config props after any platform-specific
 * props. Allows overriding all buffer config with a feature switch.
 */
// ignoring because for dev only
/* istanbul ignore next */
export function getOverrideBufferConfig(): Partial<HlsConfig> {
  if (!FeatureSwitchManager.isDefault(['Player', 'PlayerBufferBoost'])) {
    const maxMaxBufferLength = FeatureSwitchManager.get(['Player', 'PlayerBufferBoost']);
    if (typeof maxMaxBufferLength !== 'number') return {};
    const maxBufferSize = getBufferSizeFromBufferLength({ maxMaxBufferLength });

    return {
      maxMaxBufferLength,
      maxBufferSize,
    };
  }
  return {};
}

/**
 * Intended to be spread into HLS config props after any platform-specific
 * props. When the feature switch is default, does not return any config.
 */
// ignoring because for dev only
/* istanbul ignore next */
export function getOverrideProgressiveFetchConfig(): Partial<HlsConfig> {
  if (!FeatureSwitchManager.isDefault(['Player', 'PROGRESSIVE_MODE'])) {
    const progressiveMode = FeatureSwitchManager.get(['Player', 'PROGRESSIVE_MODE']);
    if (typeof progressiveMode === 'number') {
      return getConfigDetailFromMode(progressiveMode);
    }
  }
  return {};
}

export function getTracks(subtitles: {url: string, lang: string, label?: string}[] = []) {
  // todo(liam) remove replace when haofei has changed the API
  // comment above was added in #fe0c354 (src/client/features/playback/tools/playerHelper.js) in 2017
  return subtitles.map(sub => ({
    file: sub.url.replace(/\.vtt/, '.srt'),
    label: sub.label || sub.lang,
    lang: sub.lang,
  }));
}

export interface TubiPlayerConfig {
  autoStart?: boolean;
  mediaUrl: string;
  duration?: number;
  subtitles?: {
    url: string
    lang: string,
    label: string,
  }[];
  resumePos?: number;
  prerollUrl?: string;
  captionSettings?: Record<string, unknown>;
  licenseUrl?: string;
  hdcpVersion?: HDCPVersion;
  contentId?: string;
  shouldRetryMediaErrDecode?: boolean;
  defaultAudioTrack?: AdapterConfig['defaultAudioTrack'];
}

// note- this is only used by NativePlayer and Webmaf player. Samsung, Hulu, Web use their own
export const getPlayerConfig = (tubiConfig: TubiPlayerConfig) => {
  const {
    autoStart = true,
    mediaUrl,
    duration,
    subtitles,
    resumePos,
    prerollUrl,
    captionSettings,
    licenseUrl,
    hdcpVersion,
    contentId,
    shouldRetryMediaErrDecode,
    defaultAudioTrack,
  } = tubiConfig;

  return {
    autoStart,
    url: mediaUrl,
    duration,
    captionsList: getTracks(subtitles),
    resumePos,
    prerollUrl,
    captionSettings,
    licenseUrl,
    hdcpVersion,
    contentId,
    shouldRetryMediaErrDecode,
    defaultAudioTrack,
  };
};
