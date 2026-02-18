import type { RequestProcessBeforeFetchType, AdError } from '@adrise/player/lib';
import { fetchJsonAds } from '@adrise/player/lib/utils/adTools';

import { trackAdBeaconFailed } from 'client/features/playback/track/client-log';
import { palNonceManager } from 'client/features/playback/utils/palNonceManager';
import { getExperiment } from 'common/experimentV2';
import webottMajorPlatformsIgnoreErroredAds from 'common/experimentV2/configs/webottMajorPlatformsIgnoreErroredAds';
import { OnetrustClient } from 'common/features/gdpr/onetrust';
import { getLocalAdUrlBlacklist } from 'common/features/playback/utils/getLocalAdUrlBlacklist';
import { ottPALIntegrationSelector } from 'common/selectors/experiments/ottPALIntegrationSelector';
import { syncAnonymousTokensClient, getAnonymousTokenFromStorage } from 'common/utils/token';

export const getAnonymousTokenHeader = async (): Promise<Record<string, string>> => {
  try {
    await syncAnonymousTokensClient();
    const anonToken = getAnonymousTokenFromStorage();
    if (anonToken) {
      return {
        Authorization: `Bearer ${anonToken}`,
      };
    }
  } catch (e) { /** no op */ }
  return {};
};

export const adRequestProcessorForWeb = (isMock: boolean|undefined): RequestProcessBeforeFetchType => {
  return async (url: string, headers: Record<string, string|number>) => {
    let anonTokenHeader = {};
    if (isMock !== true) {
      anonTokenHeader = await getAnonymousTokenHeader();
    }
    return [
      url,
      {
        ...headers,
        ...anonTokenHeader,
        ...OnetrustClient.getRainmakerParams().header ?? {},
      },
    ];
  };
};

export const adRequestProcessorForOTT = (): RequestProcessBeforeFetchType => {
  return (url: string, headers: Record<string, string|number>) => {
    let oUrl = url;
    let oHeaders = headers;
    if (ottPALIntegrationSelector()) {
      const promiseOrNot = palNonceManager.adRequestPreProcessorWithCachedNonce(url, headers);
      if (promiseOrNot instanceof Promise) {
        return promiseOrNot.then(res => {
          const [pUrl, pHeaders] = res;
          return [
            pUrl,
            {
              ...headers,
              ...pHeaders,
              ...OnetrustClient.getRainmakerParams().header ?? {},
            },
          ];
        });
      }
      [oUrl, oHeaders] = promiseOrNot;
    }

    return [
      oUrl,
      {
        ...headers,
        ...oHeaders,
        ...OnetrustClient.getRainmakerParams().header ?? {},
      },
    ];
  };
};

export const fetchAds = (url: string, { maxRetries, timeout, isMock }: {maxRetries?: number, timeout?: number, isMock?: boolean} = {}) => {
  const enableIgnoreErroredAds = getExperiment(webottMajorPlatformsIgnoreErroredAds, { disableExposureLog: true }).get('enable_ignore_errored_ads_v0');
  const ignoreErroredAds = enableIgnoreErroredAds ? getLocalAdUrlBlacklist().map(item => item.adUrl) : [];
  return fetchJsonAds(url, {
    requestProcessBeforeFetch: __ISOTT__ ? adRequestProcessorForOTT() : adRequestProcessorForWeb(isMock),
    ...(maxRetries !== undefined ? { maxRetries } : {}),
    ...(timeout !== undefined ? { timeout } : {}),
    ignoreErroredAds: new Set(ignoreErroredAds),
    adBeaconFailedHandler: (error: AdError, adId: string) => {
      trackAdBeaconFailed(error, { id: adId, type: 'error' });
    },
  });
};
