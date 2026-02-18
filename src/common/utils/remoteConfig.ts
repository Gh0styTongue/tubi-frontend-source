import type { EventTypes } from '@tubitv/analytics/lib/events';

import getApiConfig from 'common/apiConfig';
import { STATUS_REQUEST_INTERVAL_IN_MS_MAJOR_EVENT } from 'common/features/authentication/constants/auth';
import type { ApiClientMethods } from 'common/helpers/ApiClient';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';

import { matchesUrlTemplate } from './location';

export const isBetweenStartAndEndTime = (start?: string, end?: string) => {
  if (!start || !end) return false;

  const startDate = new Date(start);
  const endDate = new Date(end);

  if (!startDate.valueOf() || !endDate.valueOf()) return false;

  const nowDate = new Date();
  return nowDate >= startDate && nowDate <= endDate;
};

export const checkIfMajorEventIsActive = (start?: string, end?: string) => {
  /* istanbul ignore next */
  if (FeatureSwitchManager.isEnabled('ForceMajorEvent')) {
    return true;
  }

  return isBetweenStartAndEndTime(start, end);
};

export const checkIfMajorEventFailsafeIsActive = (start?: string, end?: string) => {
  /* istanbul ignore next */
  if (FeatureSwitchManager.isEnabled('ForceMajorEventFailsafe')) {
    return true;
  }

  return isBetweenStartAndEndTime(start, end);
};

/**
 * A simple util to determine if a major event is active
 * Requires the window object
 * See src/common/selectors/remoteConfig.ts for a similar redux selector
 */
export const isMajorEventActive = () => {
  const { major_event_start: start, major_event_end: end } =
    (typeof window !== 'undefined' && window.__REMOTE_CONFIG__) || {};

  return checkIfMajorEventIsActive(start, end);
};

export const isMajorEventFailsafeActive = () => {
  const { major_event_failsafe_start: start, major_event_failsafe_end: end } =
    (typeof window !== 'undefined' && window.__REMOTE_CONFIG__) || {};

  return checkIfMajorEventFailsafeIsActive(start, end);
};

export const checkIsClientEnabledByThrottle = (randomNumber: number, remoteKey: 'client_log_enabled' | 'player_analytics_event_enabled' = 'client_log_enabled') => {
  if (typeof window === 'undefined') {
    return false;
  }
  const clientLogEnabled = window.__REMOTE_CONFIG__?.[remoteKey] ?? 1;
  return randomNumber < clientLogEnabled;
};

export const checkIfBlockedAnalyticsEvent = (eventName: EventTypes) => {
  const { blocked_analytics_events } = (typeof window !== 'undefined' && window.__REMOTE_CONFIG__) || {};

  return isMajorEventFailsafeActive() && blocked_analytics_events?.includes(eventName);
};

interface RemoteConfigEndpoint {
  path: string;
  methods?: ApiClientMethods[];
}

const getEndpointDisabled = () => {
  const apiConfig = getApiConfig();
  const clientEndpointsInRemoteConfig: RemoteConfigEndpoint[] = [
    { path: '/oz/log' },
    { path: '/oz/performance' },
    { path: `${apiConfig.accountServiceUserPrefix}/preferences/rate`, methods: ['get', 'patch'] },
    {
      path: apiConfig.userQueuePrefix,
      methods: ['post', 'get', 'del'],
    },
    {
      path: `${apiConfig.tensorPrefixV5}/containers/queue`,
      methods: ['get'],
    },
    {
      path: apiConfig.uapi.linearReminder,
      methods: ['post', 'get', 'del'],
    },
    {
      path: apiConfig.uapi.history,
      methods: ['post', 'get', 'del'],
    },
    {
      path: apiConfig.accountServiceConsent,
      methods: ['get', 'patch'],
    },
    {
      path: `${apiConfig.accountServiceDevicePrefix}/partner/token`,
      methods: ['get'],
    },
    {
      path: `${apiConfig.popperPrefix}/popper`,
    },
    {
      path: `${apiConfig.cmsPrefix}/content/:id/thumbnail_sprites`,
      methods: ['get'],
    },
    {
      path: apiConfig.lishiPrefix,
      methods: ['get'],
    },
  ];

  return (url: string, method?: ApiClientMethods) => {
    if (!isMajorEventFailsafeActive()) return false;
    return clientEndpointsInRemoteConfig.some(
      (v) =>
        (url.startsWith(v.path) || matchesUrlTemplate(url, v.path)) &&
        (!v.methods || !method || v.methods.includes(method))
    );
  };
};

export const isEndpointDisabled = getEndpointDisabled();

export const getStatusPollingIntervalFromConfig = () => {
  if (typeof window === 'undefined') {
    return STATUS_REQUEST_INTERVAL_IN_MS_MAJOR_EVENT;
  }
  const intervalInSec = window.__REMOTE_CONFIG__?.activation_code_status_polling_interval;
  if (!intervalInSec) {
    return STATUS_REQUEST_INTERVAL_IN_MS_MAJOR_EVENT;
  }
  // convert to milliseconds
  return intervalInSec * 1000;
};
