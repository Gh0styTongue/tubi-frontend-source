import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVNativeCaptionsCache: 'webott_firetv_native_captions_cache';
  }
}

TubiExperiments.ottFireTVNativeCaptionsCache = 'webott_firetv_native_captions_cache';

export const FIRETV_NATIVE_CAPTIONS_CACHE = {
  namespace: 'webott_firetv_native_captions_cache',
  parameter: 'use_native_cache',
};

export const getConfig = () => {
  return {
    ...FIRETV_NATIVE_CAPTIONS_CACHE,
    id: TubiExperiments.ottFireTVNativeCaptionsCache,
    experimentName: 'webott_firetv_native_captions_cache',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_native_cache', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
