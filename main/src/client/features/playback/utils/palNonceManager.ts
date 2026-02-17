import type { RequestProcessBeforeFetchType } from '@adrise/player/lib';
import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { resolve } from '@adrise/utils/lib/resolver';

import systemApi from 'client/systemApi';
import { TRACK_LOGGING, AD_LOG_SUB_TYPE } from 'common/constants/error-types';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { safeRequestIdleCallback } from 'common/utils/async';
import { getDebugLog } from 'common/utils/debug';
import { trackLogging } from 'common/utils/track';

export const GOOGLE_PAL_SDK_URL = '//imasdk.googleapis.com/pal/sdkloader/pal.js';

const enum GET_NONCE_ERROR {
  UNABLE_TO_FETCH_SDK = 'UNABLE_TO_FETCH_SDK',
  NONCE_LOADER_FAILED = 'NONCE_LOADER_FAILED',
  CRYPTO_NOT_SUPPORTED = 'CRYPTO_NOT_SUPPORTED',
}

const EXPIRED_TIME = 3 * 60; // 3 mins
const debugLog = getDebugLog('PAL Nonce Manager');

export const AD_NONCE_PRE_GENERATE_THRESHOLD = 2 * 60; // 2 mins
class PALNonceManager {
  private isSupported?: boolean;

  private nonce?: string;

  private allowStorage?: boolean;

  private expiredTimer?: ReturnType<typeof setTimeout>;

  private nonceGeneratingPromise?: Promise<string>;

  private getAllowStorage() {
    if (this.allowStorage !== undefined) {
      return this.allowStorage;
    }
    // The opt_out is true means the user has opted out of personalized ads
    // So the allowStorage should be false
    this.allowStorage = !systemApi.getAdvertiserOptOut?.();
    return this.allowStorage;
  }

  getGooglePALSDKUrl = () => {
    /* istanbul ignore next: ignore optional chaining */
    if (window?.location?.protocol.includes('http')) {
      return GOOGLE_PAL_SDK_URL;
    }
    return `https:${GOOGLE_PAL_SDK_URL}`;
  };

  generateNonce = async () => {
    let isSupported = this.isCryptoFullSupported();
    if (isSupported instanceof Promise) {
      isSupported = await isSupported;
    }
    if (!isSupported) {
      debugLog('Crypto not supported');
      trackLogging({
        type: TRACK_LOGGING.adInfo,
        subtype: AD_LOG_SUB_TYPE.AD_GET_NONCE_FAILED,
        message: {
          error: {
            type: GET_NONCE_ERROR.CRYPTO_NOT_SUPPORTED,
          },
        },
      });
      delete this.nonceGeneratingPromise;
      return '';
    }

    try {
      await resolve(this.getGooglePALSDKUrl());
      const consentSettings = new window.goog.pal.ConsentSettings();
      consentSettings.allowStorage = this.getAllowStorage();

      const nonceLoader = new window.goog.pal.NonceLoader(consentSettings);
      const request = new window.goog.pal.NonceRequest();
      request.adWillAutoPlay = false;
      request.adWillPlayMuted = false;
      request.continuousPlayback = true;
      request.iconsSupported = true;

      const manager = await nonceLoader.loadNonceManager(request);
      const nonce = manager.getNonce();
      delete this.nonceGeneratingPromise;
      return nonce;
    } catch (e) {
      this.isSupported = false;
      delete this.nonceGeneratingPromise;
      trackLogging({
        type: TRACK_LOGGING.adInfo,
        subtype: AD_LOG_SUB_TYPE.AD_GET_NONCE_FAILED,
        message: {
          type: GET_NONCE_ERROR.NONCE_LOADER_FAILED,
          ...e,
        },
      });
      return '';
    }
  };

  getNonceGeneratingPromise = () => {
    if (!this.nonceGeneratingPromise) {
      this.nonceGeneratingPromise = this.generateNonce();
    }
    return this.nonceGeneratingPromise;
  };

  preloadSDK = () => {
    const compatibilityCheck = async () => {
      let isSupported = this.isCryptoFullSupported();
      if (isSupported instanceof Promise) {
        isSupported = await isSupported;
      }
      trackLogging({
        type: TRACK_LOGGING.adInfo,
        subtype: AD_LOG_SUB_TYPE.AD_GOOGLE_SDK_PRELOAD,
        message: {
          status: isSupported ? 'success' : 'failed',
        },
      });
      if (isSupported) {
        resolve(this.getGooglePALSDKUrl()).then(() => {
          this.preGenerateNonce();
        });
      }
    };
    safeRequestIdleCallback(compatibilityCheck);
  };

  // The function should never be rejected
  isCryptoFullSupported = () => {
    if (this.isSupported !== undefined) return this.isSupported;
    /* istanbul ignore next */
    if (!window?.crypto?.subtle) {
      return this.isSupported = false;
    }
    // eslint-disable-next-line
    return window.crypto.subtle.generateKey(
      { name: 'ECDSA', namedCurve: 'P-256' },
      true,
      ['sign', 'verify']
    ).then(() => {
      return this.isSupported = true;
    }).catch(() => {
      /* istanbul ignore next */
      return this.isSupported = false;
    });
  };

  // pre process the url and headers before ad sent
  adRequestPreProcessor: RequestProcessBeforeFetchType = async (url: string, headers: Record<string, string|number>) => {
    const nonce = await this.getNonceGeneratingPromise();
    if (nonce && FeatureSwitchManager.isDefault(['Ad', 'MockUrl'])) {
      return [
        addQueryStringToUrl(url, { google_ad_icon: 'wta' }),
        {
          ...headers,
          'x-tubi-paln': nonce,
        },
      ];
    }
    return [
      url,
      { ...headers },
    ];
  };

  // pre process the url and headers before ad sent
  adRequestPreProcessorWithCachedNonce: RequestProcessBeforeFetchType = (url: string, headers: Record<string, string|number>) => {
    if (this.nonce && FeatureSwitchManager.isDefault(['Ad', 'MockUrl'])) {
      const nonce = this.nonce;
      this.nonce = undefined;
      debugLog('Use Pre Generated Nonce');
      trackLogging({
        type: TRACK_LOGGING.adInfo,
        subtype: AD_LOG_SUB_TYPE.AD_GOOGLE_NONCE_USE_PRE_GENERATED,
        message: {
          url,
        },
      });
      return [
        addQueryStringToUrl(url, { google_ad_icon: 'wta' }),
        {
          ...headers,
          'x-tubi-paln': nonce,
        },
      ];
    }
    trackLogging({
      type: TRACK_LOGGING.adInfo,
      subtype: AD_LOG_SUB_TYPE.AD_GOOGLE_NONCE_FALLBACK,
      message: {
        url,
      },
    });
    return this.adRequestPreProcessor(url, headers);
  };

  preGenerateNonce = async () => {
    if (this.nonce || this.nonceGeneratingPromise) {
      return;
    }
    this.nonce = await this.getNonceGeneratingPromise();
    debugLog(this.nonce);
    if (!this.nonce) {
      return;
    }
    debugLog('Nonce pre generated');
    this.cleanExpiredTimer();
    this.expiredTimer = setTimeout(() => {
      debugLog('Nonce expired');
      this.nonce = undefined;
    }, EXPIRED_TIME * 1000);
  };

  cleanExpiredTimer = () => {
    clearTimeout(this.expiredTimer);
    this.expiredTimer = undefined;
  };
}

export const palNonceManager = new PALNonceManager();
