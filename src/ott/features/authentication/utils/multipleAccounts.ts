import type { ValueOf } from 'ts-essentials';

import { hashStringTo32BitInteger } from 'client/utils/clientTools';
import { getData, setData, removeData } from 'client/utils/sessionDataStorage';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { safeRequestIdleCallback } from 'common/utils/async';
import { convertObjectValueToString } from 'common/utils/format';
import { trackLogging } from 'common/utils/track';

import { IS_FETCH_POPPER_WITH_TOKEN_ENABLED, MULTIPLE_ACCOUNTS_PERF_METRICS } from '../constants';

type MultipleAccountsMetricKey = ValueOf<typeof MULTIPLE_ACCOUNTS_PERF_METRICS>;

interface TrackPerformanceMetricsParams {
  deviceId?: string;
  rtuStartTime: number;
  rtuEndTime: number;
  trackingPathname?: string;
}

export const withEnabledCheck = (fn: VoidFunction) => {
  return IS_FETCH_POPPER_WITH_TOKEN_ENABLED && fn();
};

export const isFetchPopperWithTokenEnabled = (deviceId?: string) => {
  if (!deviceId) {
    return false;
  }

  const hash = hashStringTo32BitInteger(deviceId);
  return hash % 2 === 0;
};

const recordPerformanceMetric = (metricKey: MultipleAccountsMetricKey, cleanupMetricKey?: MultipleAccountsMetricKey) =>
  withEnabledCheck(() => {
    if (cleanupMetricKey) {
      removeData(cleanupMetricKey);
    }

    setData(metricKey, Date.now().toString());
  });

export const recordIntroAnimationStartTime = () => {
  recordPerformanceMetric(
    MULTIPLE_ACCOUNTS_PERF_METRICS.INTRO_ANIMATION_START_TS,
    MULTIPLE_ACCOUNTS_PERF_METRICS.INTRO_ANIMATION_END_TS
  );
};

export const recordIntroAnimationEndTime = () => {
  recordPerformanceMetric(MULTIPLE_ACCOUNTS_PERF_METRICS.INTRO_ANIMATION_END_TS);
};

export const recordFetchPopperStartTime = () => {
  recordPerformanceMetric(
    MULTIPLE_ACCOUNTS_PERF_METRICS.FETCH_POPPER_START_TS,
    MULTIPLE_ACCOUNTS_PERF_METRICS.FETCH_POPPER_END_TS
  );
};

export const recordFetchPopperEndTime = () => {
  recordPerformanceMetric(MULTIPLE_ACCOUNTS_PERF_METRICS.FETCH_POPPER_END_TS);
};

const getTime = (metricKey: MultipleAccountsMetricKey) => {
  const value = getData(metricKey);
  return value ? Number(value) : 0;
};

const getIntroAnimationStartTime = () => {
  return getTime(MULTIPLE_ACCOUNTS_PERF_METRICS.INTRO_ANIMATION_START_TS);
};

const getIntroAnimationEndTime = () => {
  return getTime(MULTIPLE_ACCOUNTS_PERF_METRICS.INTRO_ANIMATION_END_TS);
};

const getFetchPopperStartTime = () => {
  return getTime(MULTIPLE_ACCOUNTS_PERF_METRICS.FETCH_POPPER_START_TS);
};

const getFetchPopperEndTime = () => {
  return getTime(MULTIPLE_ACCOUNTS_PERF_METRICS.FETCH_POPPER_END_TS);
};

const cleanUpMetrics = () => {
  Object.values(MULTIPLE_ACCOUNTS_PERF_METRICS).forEach((metricKey) => {
    removeData(metricKey);
  });
};

export const trackPerformanceMetrics = ({
  deviceId,
  rtuStartTime,
  rtuEndTime,
  trackingPathname,
}: TrackPerformanceMetricsParams) =>
  withEnabledCheck(() => {
    safeRequestIdleCallback(() => {
      const introAnimationStartTime = getIntroAnimationStartTime();
      const introAnimationEndTime = getIntroAnimationEndTime();
      const fetchPopperStartTime = getFetchPopperStartTime();
      const fetchPopperEndTime = getFetchPopperEndTime();

      const messageMap = {
        // These original timestamps are used for debugging purposes
        introAnimationStartTime,
        introAnimationEndTime,
        fetchPopperStartTime,
        fetchPopperEndTime,

        // These fields are used for querying and grouping the data
        trackingPathname,
        rtuTime: rtuEndTime - rtuStartTime,
        fetchPopperTime: 0,
        introAnimationTime: 0,
        rtuTimeAfterIntroAnimation: 0,
        isIntroAnimationDisplayed: false,
        isRtuWithinIntroAnimation: false,
      };

      if (introAnimationStartTime > 0) {
        messageMap.isIntroAnimationDisplayed = true;
        // "introAnimationEndTime === 0" means the intro animation is not completed yet
        messageMap.isRtuWithinIntroAnimation = introAnimationEndTime === 0 || rtuEndTime <= introAnimationEndTime;

        if (introAnimationEndTime > 0) {
          messageMap.introAnimationTime = introAnimationEndTime - introAnimationStartTime;
        }

        if (!messageMap.isRtuWithinIntroAnimation) {
          // Calculate the time RTU takes to complete after intro animation ends
          messageMap.rtuTimeAfterIntroAnimation = rtuEndTime - introAnimationEndTime;
        }
      }

      if (fetchPopperStartTime > 0 && fetchPopperEndTime > fetchPopperStartTime) {
        messageMap.fetchPopperTime = fetchPopperEndTime - fetchPopperStartTime;
      }

      const isValid = [
        messageMap.introAnimationTime,
        messageMap.fetchPopperTime,
        messageMap.rtuTime,
        messageMap.rtuTimeAfterIntroAnimation,
      ].every((time) => time >= 0 && time < 60_000);

      if (!isValid) {
        cleanUpMetrics();
        return;
      }

      trackLogging({
        type: TRACK_LOGGING.clientInfo,
        subtype: LOG_SUB_TYPE.MULTIPLE_ACCOUNTS_PERF,
        message: isFetchPopperWithTokenEnabled(deviceId)
          ? 'fetchPopperWithTokenEnabled'
          : 'fetchPopperWithTokenDisabled',
        message_map: convertObjectValueToString(messageMap),
      });

      cleanUpMetrics();
    });
  });
