import type { ValueOf } from 'ts-essentials';

import getApiConfig, { getIsUsingProdAPI } from 'common/apiConfig';
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

export const REALTIME_LOGGER_HOST = getApiConfig().realtimeLoggerPrefix;

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

// change this to true for local development
const ENABLE_REALTIME_LOGGER_ON_DEVELOPMENT = false;

let warnedOnce = false;
export const warnOnceForDev = () => {
  if (warnedOnce) return;
  // eslint-disable-next-line no-console
  console.warn('In development mode, realtime metrics and logs are not sent to Datadog to avoid spam. Please set `ENABLE_REALTIME_LOGGER_ON_DEVELOPMENT` to true if you want to verify them.');
  warnedOnce = true;
};

export const trackRaw = (rawData: { metric: string, value?: number, tags?: Record<string, unknown> }[], functionName: DdClientFuncNameType = 'distribution') => {
  /* istanbul ignore next */
  if (__DEVELOPMENT__ && getIsUsingProdAPI() && !ENABLE_REALTIME_LOGGER_ON_DEVELOPMENT) {
    return warnOnceForDev();
  }
  let realtimeMetricEnabled = 1;
  if (typeof window !== 'undefined') {
    realtimeMetricEnabled = window.__REMOTE_CONFIG__?.realtime_metric_enabled ?? 1;
  }
  if (realtimeMetricEnabled !== 1 || rawData.length === 0) return;

  // We use `post` instead of `sendBeacon` here, because we need to set
  // the auth header with token, and get the user/device id at server
  ensureTrackApiClient().post(`${REALTIME_LOGGER_HOST}/metric/${functionName}`, {
    ...getExtraOptions(),
    data: rawData,
  });
};

const trackMetricsFactory = (metricPrefix: string) => (metrics: Metrics, tags?: Tags, functionName?: DdClientFuncNameType) => {
  trackRaw(Object.entries(metrics).map(([key, value]) => {
    return {
      metric: `${metricPrefix}.${key}`,
      value,
      tags,
    };
  }), functionName);
};

export const trackPerformanceMetrics = trackMetricsFactory('web-ott.performance.metrics');

export const trackVideoMetrics = trackMetricsFactory('web-ott.video.metrics');

export const trackAuthMetrics = trackMetricsFactory('web-ott.auth');

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
  /* istanbul ignore next */
  if (__DEVELOPMENT__ && getIsUsingProdAPI() && !ENABLE_REALTIME_LOGGER_ON_DEVELOPMENT) {
    return warnOnceForDev();
  }

  if (typeof window !== 'undefined') {
    const realtimeLogEnabled = window.__REMOTE_CONFIG__?.realtime_log_enabled ?? 1;
    if (realtimeLogEnabled !== 1) return;
  }

  ensureTrackApiClient().post(`${REALTIME_LOGGER_HOST}/log`, {
    ...getExtraOptions(),
    data: [{ message, context, level }],
  });
};
