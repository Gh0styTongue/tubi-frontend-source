import type { ValueOf } from 'ts-essentials';

import type { CUSTOM_TAGS } from 'common/constants/tracking-tags';
import { userSelector } from 'common/features/authentication/selectors/auth';
import type ApiClient from 'common/helpers/ApiClient';
import type { ApiClientMethodOptions } from 'common/helpers/ApiClient';
import { getApiClient } from 'common/helpers/apiClient/default';
import type { TubiStore } from 'common/types/storeState';

const DatadogClientFunctionName = {
  increment: 'increment',
  decrement: 'decrement',
  gauge: 'gauge',
  set: 'set',
  histogram: 'histogram',
  distribution: 'distribution',
} as const;

// istanbul ignore next
const prefix = __PRODUCTION__ ? 'production' : 'staging';
export const REALTIME_LOGGER_HOST = `https://realtime-logger.${prefix}-public.tubi.io`;

type DdClientFuncNameType = ValueOf<typeof DatadogClientFunctionName>;

type Metrics = Record<string, number | undefined>;
type Tags = Partial<Record<CUSTOM_TAGS, string | boolean>>;

let userToken: string | undefined;

export const syncUserTokenForDatadog = (store: TubiStore) => {
  const state = store.getState();
  const user = userSelector(state);
  userToken = user?.token;
};

const getExtraOptions = (): ApiClientMethodOptions => {
  if (userToken) {
    return {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    };
  }
  return {
    useAnonymousToken: true,
    shouldSetAuthorizationHeader: true,
  };
};

// Created a new client for logs and metrics to avoid circular dependency
let _apiClient: ApiClient;
export const ensureTrackApiClient = () => {
  if (!_apiClient) {
    _apiClient = getApiClient().create();
  }
  return _apiClient;
};

export const trackRaw = (rawData: { metric: string, value?: number, tags?: Record<string, unknown> }[], functionName: DdClientFuncNameType = 'distribution') => {
  if (rawData.length === 0) return;

  // We use `post` instead of `sendBeacon` here, because we need to set
  // the auth header with token, and get the user/device id at server
  ensureTrackApiClient().post(`${REALTIME_LOGGER_HOST}/metric/${functionName}`, {
    ...getExtraOptions(),
    data: rawData,
  });
};

export const trackPerformanceMetrics = (metrics: Metrics, tags?: Tags, functionName?: DdClientFuncNameType) => {
  trackRaw(Object.entries(metrics).map(([key, value]) => {
    return {
      metric: `performance.metrics.${key}`,
      value,
      tags,
    };
  }), functionName);
};

export const trackVideoMetrics = (metrics: Metrics, tags?: Tags, functionName?: DdClientFuncNameType) => {
  trackRaw(Object.entries(metrics).map(([key, value]) => {
    return {
      metric: `video.metrics.${key}`,
      value,
      tags,
    };
  }), functionName);
};

export const trackWhitelistedMetricsAndWarnAboutOthers = ({
  keysWhitelist,
  metrics,
  tags,
  metricNamePrefix = '',
}: {
  keysWhitelist: string[];
  metrics: Metrics;
  tags?: Tags;
  metricNamePrefix?: string,
}) => {
  const allowedMetrics: Metrics = {};
  const disallowedMetrics: string[] = [];

  Object.entries(metrics).forEach(([key, value]) => {
    if (keysWhitelist.includes(key)) {
      allowedMetrics[`${metricNamePrefix}${key}`] = value;
    } else {
      disallowedMetrics.push(key);
    }
  });

  // istanbul ignore else
  if (Object.keys(allowedMetrics).length > 0) {
    trackPerformanceMetrics(allowedMetrics, tags);
  }

  // istanbul ignore next
  if (!__PRODUCTION__ && disallowedMetrics.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`The following metrics are not in the whitelist and will not be sent to DataDog: ${disallowedMetrics.join(', ')}.`);
  }
};

export const sendLog = (message: string, context: Record<string, unknown> = {}, level: string = 'info') => {
  ensureTrackApiClient().post(`${REALTIME_LOGGER_HOST}/log`, {
    ...getExtraOptions(),
    data: [{ message, context, level }],
  });
};
