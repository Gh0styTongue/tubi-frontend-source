import { addQueryStringToUrl, parseQueryString, getQueryStringFromUrl } from '@adrise/utils/lib/queryString';
import { resolve } from '@adrise/utils/lib/resolver';

import ApiClient from 'common/helpers/ApiClient';

const GET_NONCE_ERROR = {
  UNABLE_TO_FETCH_SDK: 'UNABLE_TO_FETCH_SDK',
  NONCE_LOADER_FAILED: 'NONCE_LOADER_FAILED',
};

const getGoogleNonceRequestParams = (url) => {
  const queries = parseQueryString(getQueryStringFromUrl(url));
  return {
    opt_out: !!queries.opt_out,
  };
};

export function getNonceFromGooglePalSDK(url) {
  return new Promise((res) => {
    resolve('//imasdk.googleapis.com/pal/sdkloader/pal.js').then(
      () => {
        const requestConfig = getGoogleNonceRequestParams(url);
        const consentSettings = new window.goog.pal.ConsentSettings();
        consentSettings.allowStorage = requestConfig.opt_out;

        const nonceLoader = new window.goog.pal.NonceLoader();
        const request = new window.goog.pal.NonceRequest();
        request.adWillAutoPlay = true;
        request.adWillPlayMuted = false;
        request.continuousPlayback = true;
        request.iconsSupported = true;

        const managerPromise = nonceLoader.loadNonceManager(request);
        managerPromise.then((manager) => {
          res({ nonce: manager.getNonce() });
        }).catch(() => {
          res({ error: GET_NONCE_ERROR.NONCE_LOADER_FAILED });
        });
      }
    ).catch(() => {
      res({ error: GET_NONCE_ERROR.UNABLE_TO_FETCH_SDK });
    });
  });
}

export function buildAdQueue(rawData = {}) {
  return (rawData.items || []).map(item => ({
    id: item.ad_id,
    video_id: item.ad_video_id ? item.ad_video_id.toString() : undefined,
    video: item.media.streamurl,
    duration: parseInt(item.media.duration, 10),
    imptracking: item.imptracking || [],
    trackingevents: item.media.trackingevents,
    request_id: rawData.metadata ? rawData.metadata.request_id : undefined,
    skiptracking: item.skiptracking || [],
    error: item.error || undefined,
    icon: item.icon,
  }));
}

export function fetchAds(url, options) {
  const urlWithWTA = addQueryStringToUrl(url, { google_ad_icon: 'wta' });
  const getNoncePromise = () => {
    if (options && options.enableGooglePALInAdRequest) {
      return getNonceFromGooglePalSDK(urlWithWTA);
    }
    return Promise.resolve({});
  };

  return getNoncePromise().then(({ nonce }) => {
    let fetchUrl = url;
    const headers = {
      Accept: 'application/json',
    };
    if (nonce) {
      fetchUrl = urlWithWTA;
      headers['x-tubi-paln'] = nonce;
    }
    const apiClient = new ApiClient();
    return apiClient.get(fetchUrl, {
      headers,
    });
  }).then((data) => {
    return buildAdQueue(data);
  }).catch(() => []);
}

export function sendBeaconRequest(urls) {
  [].concat(urls).filter(Boolean).forEach((url) => {
    const img = new Image();
    img.src = url;
  });
}

export function getTrackFn(ad) {
  const timePoints = [0, 25, 50, 75, 100];
  const firedPercent = {};

  return (position) => {
    timePoints.some((timePoint) => {
      if (firedPercent[timePoint]) return false;
      if (position < Math.ceil(ad.duration * timePoint / 100)) return false;

      firedPercent[timePoint] = true;

      try {
        sendBeaconRequest(ad.trackingevents[`tracking_${timePoint}`]);
        if (timePoint === 0) {
          sendBeaconRequest(ad.imptracking);
        }
        return true;
      } catch (e) {
        return true;
      }
    });
  };
}

/**
 * Will create an object used in AdMessage component to calculate how much each adPod
 * will take in whole adBreak. so if there are 2 ads the first ad will be 0.5 (out of 1)
 * @param  {number} adCount
 * @returns {object} e.g. calculateAdSequenceCompletionProgress(2) ~> {0:0, 1: 0.5, 2: 1}
 */
export const calculateAdSequenceCompletionProgress = (adCount) => {
  const completionProgress = { 0: 0 };
  for (let seq = 1; seq < adCount + 1; seq++) {
    if (adCount === seq) {
      // last one all the way to 1
      completionProgress[seq] = 1;
    } else {
      const prevSequenceCompletedProgress = completionProgress[seq - 1] || 0;
      completionProgress[seq] = prevSequenceCompletedProgress + Math.floor(100 / adCount) / 100;
    }
  }
  return completionProgress;
};
