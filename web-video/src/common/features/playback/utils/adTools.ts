import type { RequestProcessBeforeFetchType } from '@adrise/player/lib';

import { palNonceManager } from 'client/features/playback/utils/palNonceManager';
import { OnetrustClient } from 'common/features/gdpr/onetrust';
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

export const adRequestProcessorForWeb = (useAuth: boolean): RequestProcessBeforeFetchType => {
  return async (url: string, headers: Record<string, string|number>) => {
    let anonTokenHeader = {};
    if (useAuth) {
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

export const adRequestProcessorForOTT = (enablePAL: boolean, callback?: VoidFunction): RequestProcessBeforeFetchType => {
  return (url: string, headers: Record<string, string|number>) => {
    let oUrl = url;
    let oHeaders = headers;
    if (enablePAL) {
      const promiseOrNot = palNonceManager.adRequestPreProcessorWithCachedNonce(url, headers);
      if (promiseOrNot instanceof Promise) {
        return promiseOrNot.then(res => {
          const [pUrl, pHeaders] = res;
          // Callback to log exposure after PAL nonce is fetched and before rainmaker request is made
          callback?.();
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

    // Callback to log exposure after PAL nonce is fetched and before rainmaker request is made
    callback?.();
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
