import type { AdPod, PresetAdType } from '@adrise/player';

import { trackAdPodFetch } from 'client/features/playback/track/client-log';
import { trackPreloadAdMissed } from 'client/features/playback/track/client-log/trackPreloadAdMissed';
import { trackPreSetAdsFetch } from 'client/features/playback/track/client-log/trackPreSetAdsFetch';
import { fetchAds } from 'common/features/playback/utils/adTools';
import logger from 'common/helpers/logging';

export type RainmakerCacheItem = {
  adsPreFetch?: Promise<AdPod>;
  preRequestFrom: PresetAdType;
  isSeries: boolean;
};

let rainmakerTempCache: Record<string, RainmakerCacheItem> = {};

/**
 * Clears the rainmaker temp cache
 * @param id if provided calls to track missed ads for each key that does
 *           not match provided id.
 */
export const clearRainmakerTempCache = (id?: string) => {
  Object.keys(rainmakerTempCache).forEach((key) => {
    /* istanbul ignore else */
    if (id !== key && rainmakerTempCache[key].adsPreFetch) {
      const { adsPreFetch, isSeries, preRequestFrom } = rainmakerTempCache[key];
      adsPreFetch.then((ads) => {
        trackPreloadAdMissed({
          content_id: key,
          preRequestFrom,
          adCount: ads.length,
          isSeries,
          totalAdDuration: Math.round(ads.reduce((prev, curr) => prev + curr.duration, 0) * 1000),
        });
      }).catch();
    }
  });
  rainmakerTempCache = {};
};

export const getRainmakerCacheItem = (id: string) => {
  return rainmakerTempCache[id];
};

export const setRainmakerCacheItem = (id: string, cacheItem: RainmakerCacheItem) => {
  rainmakerTempCache[id] = cacheItem;
};

type AdsPreFetchProps = {
  contentId: string;
  isSeries: boolean;
  preRequestFrom: PresetAdType;
  rainmakerUrl: string;
  requestTimeout?: number;
  skipError?: boolean;
};

export function getAdsPreFetch({
  contentId,
  isSeries,
  preRequestFrom,
  rainmakerUrl,
  requestTimeout = 10_000,
  skipError = false,
}: AdsPreFetchProps) {
  return fetchAds(rainmakerUrl, {
    timeout: requestTimeout,
  }).then(({ ads, metrics }) => {
    const formattedAds = ads.map(ad => ({ ...ad,
      presetAdType: preRequestFrom,
    }));
    trackPreSetAdsFetch({
      url: rainmakerUrl,
      preRequestFrom,
      content_id: contentId,
      adCount: ads.length,
      isSeries,
    });
    trackAdPodFetch({
      adType: 'preroll',
      isError: false,
      metrics,
      adsCount: ads.length,
      presetAdType: preRequestFrom,
    });
    return formattedAds;
  }).catch((error) => {
    setRainmakerCacheItem(contentId, { preRequestFrom, isSeries, adsPreFetch: skipError ? Promise.resolve([]) : undefined });
    trackPreSetAdsFetch({
      url: rainmakerUrl,
      preRequestFrom,
      content_id: contentId,
      adCount: 0,
      isSeries,
      errorMsg: error.message,
    });
    trackAdPodFetch({
      adType: 'preroll',
      isError: true,
      metrics: {
        retries: error.retries,
        responseTime: error.responseTime,
        timeout: error.timeout,
        maxRetries: error.maxRetries,
      },
      message: error.message,
      adsCount: -1,
      presetAdType: preRequestFrom,
    });
    logger.error(`Error fetching preroll ads for ${preRequestFrom}:${error.message}`);
    return [];
  });
}

export const useRainmakerTempCacheAds = (id: string) => {
  return rainmakerTempCache[id]?.adsPreFetch;
};
