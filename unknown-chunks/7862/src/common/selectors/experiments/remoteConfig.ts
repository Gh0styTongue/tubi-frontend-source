import { PlayerName } from '@adrise/player';
import { createSelector } from 'reselect';

import { sampleString } from 'client/utils/clientTools';
import { DEVICE_SAMPLE_RATE } from 'common/constants/sample-devices';
import { youboraConfigSelector } from 'common/selectors/remoteConfig';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';
let rate = {
  performance: {
    vod: 0,
    live: 0,
    preview: 0,
  },
};
if (__ISOTT__) {
  if (DEVICE_SAMPLE_RATE[__OTTPLATFORM__]) {
    rate = DEVICE_SAMPLE_RATE[__OTTPLATFORM__];
  }
} else if (__WEBPLATFORM__ === 'WEB') {
  rate = DEVICE_SAMPLE_RATE.WEB;
}

/* istanbul ignore next */
function assertUnreachable(_x: never): never {
  throw new Error('Unhandled case');
}

/**
 * __REMOTE_CONFIG__ is initialized with config hub API.
 */
export function isYouboraEnabled(playerName: PlayerName, state?: StoreState): boolean {
  if (FeatureSwitchManager.isEnabled(['Player', 'Youbora'])) return true;
  let youbora = window.__REMOTE_CONFIG__?.youbora;
  // We request the remote config on client side while in dev mode or on samsung
  // The __REMOTE_CONFIG__ is not available in that time since it's updated after rendering
  if ((__DEVELOPMENT__ || __OTTPLATFORM__ === 'TIZEN' || !youbora) && state) {
    youbora = youboraConfigSelector(state);
  }
  const { vod = false, linear = false, preview = false, trailer = false } = youbora || {};
  switch (playerName) {
    case PlayerName.VOD:
      return vod;
    case PlayerName.Linear:
      return linear;
    case PlayerName.Preview:
      return preview;
    case PlayerName.Trailer:
      return trailer;
    case PlayerName.AD:
      return false;
    /* istanbul ignore next */
    default:
      /* istanbul ignore next */
      return assertUnreachable(playerName);
  }
}

/**
 * Some platforms will have window.performance but not
 * window.performance.mark and window.performance.measure
 * we need all of these properties to run measurements
 */
function hasNecessaryPerformanceApi(): boolean {
  return typeof performance !== 'undefined' && !!performance.mark && !!performance.measure;
}

const isE2ETest = () => __CLIENT__ && typeof Cypress !== 'undefined';

export const livePerformanceMetricEnabledSelector = createSelector(
  (state: StoreState) => String(state.auth.deviceId),
  () => hasNecessaryPerformanceApi(),
  () => FeatureSwitchManager.isEnabled(['Player', 'Performance']),
  () => isE2ETest(),
  (deviceId, hasPerformanceApi, featureSwitch, isE2E) => hasPerformanceApi && (sampleString(deviceId, rate.performance.live, 'livePerformanceMetric') || featureSwitch || isE2E),
);

export const vodPerformanceMetricEnabledSelector = createSelector(
  (state: StoreState) => String(state.auth.deviceId),
  () => hasNecessaryPerformanceApi(),
  () => FeatureSwitchManager.isEnabled(['Player', 'Performance']),
  () => isE2ETest(),
  (deviceId, hasPerformanceApi, featureSwitch, isE2E) => hasPerformanceApi && (sampleString(deviceId, rate.performance.vod, 'vodPerformanceMetric') || featureSwitch || isE2E),
);

export const previewPerformanceMetricEnabledSelector = createSelector(
  (state: StoreState) => String(state.auth.deviceId),
  () => hasNecessaryPerformanceApi(),
  () => FeatureSwitchManager.isEnabled(['Player', 'Performance']),
  () => isE2ETest(),
  (deviceId, hasPerformanceApi, featureSwitch, isE2E) => hasPerformanceApi && (sampleString(deviceId, rate.performance.preview, 'previewPerformanceMetric') || featureSwitch || isE2E),
);

export const uiNavigationPerformanceMetricEnabledSelector = createSelector(
  (state: StoreState) => String(state.auth.deviceId),
  () => hasNecessaryPerformanceApi(),
  () => isE2ETest(),
  (deviceId, hasPerformanceApi, isE2E) => hasPerformanceApi && (sampleString(deviceId, 0.1, 'uiNavigationPerformanceMetric') || isE2E),
);
