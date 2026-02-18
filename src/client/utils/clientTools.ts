import type { Bridge, BridgeOption } from '@adrise/dsbridge';
import Analytics from '@tubitv/analytics';

import { REDIRECT_FROM } from 'common/constants/constants';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { PLATFORMS } from 'common/constants/platforms';
import logger from 'common/helpers/logging';
import { isPlatform } from 'common/utils/platform';
import { trackLogging } from 'common/utils/track';
import { getUrlParam } from 'common/utils/urlManipulation';

import DevelopmentDSBridge from './DevelopmentDSBridge';

const MAX_32_BIT_INTEGER = 2 ** 31;

// @link https://developer.samsung.com/internet/user-agent-string-format
export const isTizenBrowser = () => window.navigator.userAgent.includes('Tizen');

export const parseUrl = (url = location.href) => {
  const parser = document.createElement('a');
  parser.href = url;

  if (isPlatform(PLATFORMS.tizen)) {
    const { protocol, hostname, hash } = parser;
    parser.href = `${protocol}//${hostname}${hash.replace(/^#/, '')}`;
  }

  return {
    pathname: parser.pathname,
    search: parser.search,
    host: parser.host,
  };
};

/**
 * check whether url is a hls url
 * @param url
 * @returns {boolean}
 */
export const isHls = (url:string) => {
  /* istanbul ignore next */
  const { pathname = '' } = parseUrl(url);

  return pathname.endsWith('.m3u8');
};

// return a bool indicating if sender is connected to chromecast receiver
export const isCastConnected = (castReceiverState: string): boolean => {
  if (typeof window === 'undefined' || !window.cast) return false;
  return !!(window.cast.framework && (castReceiverState === window.cast.framework.CastState.CONNECTED));
};

export const supportsVoiceViewAccessibility = () =>
  __IS_COMCAST_PLATFORM_FAMILY__
  || __IS_ANDROIDTV_HYB_PLATFORM__
  || isPlatform([
    PLATFORMS.firetv_hyb,
    PLATFORMS.tizen,
    PLATFORMS.vizio,
    PLATFORMS.tivo,
    PLATFORMS.hisense,
    PLATFORMS.xboxone,
    PLATFORMS.lgtv,
  ]);

/**
 * setup dsBridge env locally for debugging
 * @param handlerMap for debug purpose, in prod, the handlers will be provided by native side(android)
 */

export const setupDsBridgeForDevEnv = (handlerMap = {}) => {
  if (!__DEVELOPMENT__) return;
  if (window._dsbridge) {
    /* istanbul ignore else */
    if (Object.keys(handlerMap).length) {
      (window._dsbridge as any).handlerMap = {
        ...handlerMap,
        ...(window._dsbridge as any).handlerMap,
      };
    }
    return;
  }
  window._dsbridge = (new DevelopmentDSBridge(handlerMap)) as unknown as typeof window._dsbridge;
};

export const isBridgeAvailable = () => __IS_ANDROIDTV_HYB_PLATFORM__ || isFireTVDevice();

/**
 * Use singleton pattern to have only one instance of getBridge in the app
 */
export const getBridge = (function createBridge() {
  let bridge: Bridge;

  return (options?: BridgeOption) => {
    if (!bridge) {
      try {
        const dsbridge = require('@adrise/dsbridge');
        bridge = dsbridge.getBridge(options);
      } catch (err) {
        trackLogging({
          type: TRACK_LOGGING.clientInfo,
          subtype: LOG_SUB_TYPE.JSBRIDGE.INIT_JSBRIDGE,
          message: {
            error_name: err.name || err.code || 'unknown error',
            error_message: err.message || 'error setting up dsbridge',
          },
        });
        logger.error(err, 'error when setting up dsbridge');
      }
    }
    return bridge;
  };
}());

export function isHisense5659() : boolean {
  return __OTTPLATFORM__ === 'HISENSE' && window.navigator.userAgent.includes('Chrome/59');
}

export function isHisense6886(): boolean {
  return __OTTPLATFORM__ === 'HISENSE' && window.navigator.userAgent.includes('Chrome/57');
}

export function isVizioV505H9(): boolean {
  return __OTTPLATFORM__ === 'VIZIO' && window.navigator.userAgent.includes('V505-H9');
}

export function isLGTVUsingChrome53(): boolean {
  return __OTTPLATFORM__ === 'LGTV' && window.navigator.userAgent.includes('Chrome/53');
}

export function isLGTVUsingChrome68(): boolean {
  return __OTTPLATFORM__ === 'LGTV' && window.navigator.userAgent.includes('Chrome/68');
}

/**
 * @link https://developer.amazon.com/docs/fire-tv/user-agent-strings.html
 */
export function isFireTVDevice(): boolean {
  return __OTTPLATFORM__ === 'FIRETV_HYB' && (/\bAFT\w+ Build\//).test(window.navigator.userAgent);
}

/**
 * @link https://developer.amazon.com/docs/fire-tv/device-specifications-fire-tv-pendant-box.html?v=ftvgen1
 */
export function isFireTVGen1(): boolean {
  return __OTTPLATFORM__ === 'FIRETV_HYB' && (/\bAFTB Build\//).test(window.navigator.userAgent);
}

/**
 * @link https://developer.amazon.com/docs/fire-tv/device-specifications-fire-tv-stick.html?v=ftvstickgen1
 */
export function isFireTVStickGen1(): boolean {
  return __OTTPLATFORM__ === 'FIRETV_HYB' && (/\bAFTM Build\//).test(window.navigator.userAgent);
}

export function getComeFromVODRelaunch() {
  const params = getUrlParam();
  // Relaunch Url like `http://xxx.tubi.tv/ott/player/678482?r_from=relaunch_vod&resume_time=856`
  return params[REDIRECT_FROM];
}

const hashStringTo32BitInteger = (str: string): number => {
  let hash = 0;
  /* istanbul ignore next */
  if (str.length === 0) return hash;
  for (let i = 0, len = str.length; i < len; i++) {
    /* eslint-disable no-bitwise */
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
    /* eslint-enable no-bitwise */
  }
  return hash;
};

/**
 * Sample given string with rate and salt
 * @param {string} input
 * @param {number} rate
 * @param {string} salt This is used to distinguish different sampling results
 * @returns
 */

export function sampleString(input: string, rate: number, salt = ''): boolean {
  if (!input || !rate || typeof input !== 'string' || rate <= 0) {
    return false;
  }

  if (rate >= 1) {
    return true;
  }

  const hashId = hashStringTo32BitInteger(input + salt);
  const standard = (2 * rate - 1) * MAX_32_BIT_INTEGER;

  return standard >= hashId;
}

export function isKeyInUserAgent(key: string): boolean {
  if (typeof window === 'undefined') return false;
  return window.navigator.userAgent.includes(key);
}

export function isInJSDOM(): boolean {
  return isKeyInUserAgent('jsdom');
}

export function isInComcastDevice(): boolean {
  return __IS_COMCAST_PLATFORM_FAMILY__ && isKeyInUserAgent('WPE');
}

export function isInLGTVDevice(): boolean {
  return __OTTPLATFORM__ === 'LGTV' && isKeyInUserAgent('SmartTV');
}

export function isInVizioDevice(): boolean {
  return __OTTPLATFORM__ === 'VIZIO' && typeof window.VIZIO !== 'undefined';
}

export function isInPS4Device(): boolean {
  return __OTTPLATFORM__ === 'PS4' && isKeyInUserAgent('PlayStation');
}

/**
 * @link https://developer.amazon.com/docs/fire-tv/device-specifications-fire-tv-edition-smart-tv.html?v=omniseries
 * @link https://developer.amazon.com/docs/fire-tv/device-specifications-fire-tv-edition-smart-tv.html?v=omniseries2
 */
export function isFireTVOmni(): boolean {
  return __OTTPLATFORM__ === 'FIRETV_HYB' && (/\bAFTTIFF43 Build\//).test(window.navigator.userAgent);
}

export function isWindowsDevice(): boolean {
  return __WEBPLATFORM__ === 'WEB' && isKeyInUserAgent('Windows');
}

export function isWebWindows7(): boolean {
  const deviceInfo = Analytics.getAnalyticsConfig();
  return __WEBPLATFORM__ === 'WEB' && deviceInfo && deviceInfo.os === 'Windows' && deviceInfo.os_version === '7';
}

export function isWebWindows8(): boolean {
  const deviceInfo = Analytics.getAnalyticsConfig();
  return __WEBPLATFORM__ === 'WEB' && deviceInfo && deviceInfo.os === 'Windows' && (deviceInfo.os_version === '8' || deviceInfo.os_version === '8.1');
}
