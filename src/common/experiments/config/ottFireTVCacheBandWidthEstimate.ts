import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVCacheBandWidthEstimate: 'webott_firetv_start_with_cached_bandwidth';
  }
}

TubiExperiments.ottFireTVCacheBandWidthEstimate = 'webott_firetv_start_with_cached_bandwidth';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottFireTVCacheBandWidthEstimate,
    namespace: 'webott_firetv_start_with_cached_bandwidth',
    parameter: 'use_cached_bandwidth',
    experimentName: 'webott_firetv_start_with_cached_bandwidth',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_cached_bandwidth', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
