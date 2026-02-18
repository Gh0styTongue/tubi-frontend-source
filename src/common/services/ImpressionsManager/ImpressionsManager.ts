import { getStore } from 'client/store/default';
import { HDC_CONTAINER_PREFIX } from 'common/features/hdcAd/constants';
import type ApiClient from 'common/helpers/ApiClient';
import { getApiClient } from 'common/helpers/apiClient/default';

import { getPageObjectFromURL } from '../../utils/analytics';
import { getAnalyticsPlatform } from '../../utils/getAnalyticsPlatform';
import { getCurrentPathname } from '../../utils/getCurrentPathname';

type UserSignalsSeriesContents = {
  series_id: number;
  row: number;
  col: number;
  duration: number;
};

type UserSignalsVideoContents = {
  video_id: number;
  row: number;
  col: number;
  duration: number;
};

type UserSignalsAdContents = {
  ad_id: number;
  row: number;
  col: number;
  duration: number;
};

type UserSignalsContents = UserSignalsVideoContents | UserSignalsSeriesContents | UserSignalsAdContents;

type UserSignalsContainer = {
  id: string;
  contents: UserSignalsContents[]
};

type ImpressionsRequest = {
  sent_timestamp: string;
  platform: string;
  device_id: string;
  user_id?: number;
  personalization_id: string;
  containers: UserSignalsContainer[];
} & NonNullable<ReturnType<typeof getPageObjectFromURL>>;

export type Impression = {
  contentId: string;
  containerId: string;
  row: number;
  col: number;
  personalizationId: string;
  isSeries?: boolean;
};

type ActiveImpression = Impression & { startTime: number; pathname: string; searchQuery: string };
type ConcludedImpression = Impression & { duration: number; pathname: string; searchQuery: string };

// The minimum duration for an impression to be considered valid and logged
export const VALID_DURATION = 1000;
// The amount of time to retain concluded impressions before sending them to the server
export const DEFAULT_IMPRESSIONS_TIMEOUT = 20 * 1000;
// The maximum number of concluded impressions to retain before sending them to the server, even if the timeout has not been reached
export const MAX_CONCLUDED_IMPRESSIONS = 10;
export const AUTO_PLAY_CONTAINER_ID_IMPRESSION = 'auto_play';
export const RELATED_CONTENTS_CONTAINER_ID_IMPRESSION = 'you_may_also_like';

export const productionImpressionsEndpoint = 'https://user-signals.production-public.tubi.io/user-signals/v1/single-event';
export const stagingImpressionsEndpoint = 'https://user-signals.staging-public.tubi.io/user-signals/v1/single-event';

export class ImpressionsManager {
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  private concludedImpressions: ConcludedImpression[] = [];

  private activeImpressions: Map<string, ActiveImpression> = new Map();

  private apiClient: ApiClient;

  constructor() {
    this.apiClient = getApiClient().create();
  }

  private constructKey({ contentId, containerId, row, col }: Impression) {
    return `${contentId}-${containerId}-${row}-${col}`;
  }

  trackStart(...impressions: Impression[]) {
    if (impressions.length > 0) {
      const startTime = Date.now();
      const pathname = getCurrentPathname();
      const { search: { key: searchQuery } } = getStore().getState();
      impressions.forEach((impression) => {
        const contentKey = this.constructKey(impression);
        if (!this.activeImpressions.has(contentKey)) {
          this.activeImpressions.set(contentKey, { ...impression, startTime, pathname, searchQuery });
        }
      });
      this.scheduleNextTick();
    }
  }

  trackEnd(...impressions: Impression[]) {
    if (impressions.length > 0) {
      const endTime = Date.now();
      impressions.forEach((impression) => {
        const contentKey = this.constructKey(impression);
        if (this.activeImpressions.has(contentKey)) {
          const { startTime, ...concludedImpression } = this.activeImpressions.get(contentKey)!;
          this.activeImpressions.delete(contentKey);
          const duration = endTime - startTime;
          if (this.isValidDuration(duration)) {
            this.concludedImpressions.push({ ...concludedImpression, duration });
          }
        }
      });
      if (this.concludedImpressions.length >= MAX_CONCLUDED_IMPRESSIONS) {
        this.processTick();
      }
    }
  }

  trackEndAll() {
    if (this.activeImpressions.size > 0) this.trackEnd(...Array.from(this.activeImpressions.values()));
  }

  private logImpressions() {
    const bucketedImpressions = new Map<string, ConcludedImpression[]>();
    this.concludedImpressions.forEach((impression) => {
      const { personalizationId, pathname } = impression;
      const key = `${personalizationId}-${pathname}`;
      const existingImpressions = bucketedImpressions.get(key);
      if (existingImpressions) {
        existingImpressions.push(impression);
      } else {
        bucketedImpressions.set(key, [impression]);
      }
    });
    this.concludedImpressions = [];
    bucketedImpressions.forEach((impressions) => {
      const { personalizationId: personalization_id, pathname, searchQuery } = impressions[0];
      const containerContents = new Map<string, UserSignalsContents[]>();
      impressions.forEach((impression) => {
        const { containerId, row, col, duration, contentId, isSeries } = impression;
        let contents: UserSignalsContents = isSeries
          ? { series_id: parseInt(contentId, 10), row, col, duration }
          : { video_id: parseInt(contentId, 10), row, col, duration };
        if (containerId.startsWith(HDC_CONTAINER_PREFIX)) {
          contents = { ad_id: parseInt(contentId, 10), row, col, duration };
        }
        const existingContainer = containerContents.get(containerId);
        if (existingContainer) {
          existingContainer.push(contents);
        } else {
          containerContents.set(containerId, [contents]);
        }
      });
      this.concludedImpressions = [];
      const containers: UserSignalsContainer[] = Array.from(containerContents.entries())
        .map(([id, contents]) => ({
          id,
          contents,
        }));
      const { auth: { deviceId: device_id, user } } = getStore().getState();
      const user_id = user ? { user_id: user.userId } : {};
      const platform = getAnalyticsPlatform(__OTTPLATFORM__ || __WEBPLATFORM__);
      const pageType = getPageObjectFromURL(pathname, { query: searchQuery });
      if (device_id && pageType) {
        const data: ImpressionsRequest = {
          sent_timestamp: new Date().toISOString(),
          platform,
          device_id,
          personalization_id,
          containers,
          ...user_id,
          ...pageType,
        };
        const impressionsEndpoint = process.env.USE_PROD_API || __PRODUCTION__
          ? productionImpressionsEndpoint
          : stagingImpressionsEndpoint;
        this.apiClient.sendBeacon(impressionsEndpoint, { data } as Record<string, unknown>);
      }
    });
  }

  private scheduleNextTick() {
    if (!this.timeoutId && (this.concludedImpressions.length > 0 || this.activeImpressions.size > 0)) {
      this.timeoutId = setTimeout(() => {
        this.processTick();
      }, DEFAULT_IMPRESSIONS_TIMEOUT);
    }
  }

  processTick() {
    clearTimeout(this.timeoutId);
    this.timeoutId = undefined;
    this.logImpressions();
    this.scheduleNextTick();
  }

  private isValidDuration(duration: number) {
    return duration >= VALID_DURATION;
  }
}
