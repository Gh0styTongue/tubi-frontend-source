import { reportClientTiming, reportImageTiming, reportResourceTiming } from 'client/utils/performance';
import { IS_RESOURCE_TIMING_SAMPLE_RATE_ENABLED } from 'common/constants/constants';
import type { TubiStore } from 'common/types/storeState';

export const setupPerformanceTracking = (store: TubiStore) => {
  const perfTrackingEnabled = __PRODUCTION__ || __STAGING__;
  if (perfTrackingEnabled && window.addEventListener) {
    window.addEventListener('load', () => {
      const {
        auth: { deviceId },
        experiments: { performanceTag },
      } = store.getState();
      reportClientTiming(performanceTag);
      if (
        !IS_RESOURCE_TIMING_SAMPLE_RATE_ENABLED ||
        (IS_RESOURCE_TIMING_SAMPLE_RATE_ENABLED && deviceId?.endsWith('a'))
      ) {
        reportResourceTiming(performanceTag);
      }
    });
  }

  if (perfTrackingEnabled) {
    const {
      auth: { deviceId },
    } = store.getState();
    if (deviceId?.endsWith('a')) {
      reportImageTiming();
    }
  }
};
