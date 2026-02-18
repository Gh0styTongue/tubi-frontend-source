import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';
import { isSamsungBefore2017 } from 'common/utils/tizenTools';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungEnableMultipleDrmKeys: 'webott_samsung_enable_multiple_drm_keys';
  }
}

TubiExperiments.ottSamsungEnableMultipleDrmKeys = 'webott_samsung_enable_multiple_drm_keys';

export const SAMSUNG_ENABLE_MULTIPLE_DRM_KEYS = {
  namespace: 'webott_samsung_enable_multiple_drm_keys',
  parameter: 'enable_multiple_drm_keys',
};

export const getConfig = () => {
  return {
    ...SAMSUNG_ENABLE_MULTIPLE_DRM_KEYS,
    id: TubiExperiments.ottSamsungEnableMultipleDrmKeys,
    experimentName: 'webott_samsung_enable_multiple_drm_keys',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_multiple_drm_keys', value: true },
    ],
    enabledSelector: () => {
      if (__OTTPLATFORM__ !== 'TIZEN') {
        return false;
      }
      try {
        return !isSamsungBefore2017();
      } catch {
        // state userAgent isn't always set and the type
        // at compile time assumes it exists. This catch
        // is being used to avoid multiple optional
        // chaining.
        return false;
      }
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
