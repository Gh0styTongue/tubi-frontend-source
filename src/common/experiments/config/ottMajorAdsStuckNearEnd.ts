import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorAdsStuckNearEnd: 'webott_major_complete_ads_stuck_near_end_v0';
  }
}

TubiExperiments.ottMajorAdsStuckNearEnd = 'webott_major_complete_ads_stuck_near_end_v0';

export const getConfig = () => {
  return {
    namespace: 'webott_major_complete_ads_stuck_near_end_v0',
    parameter: 'complete_ads_stuck_near_end',
    id: TubiExperiments.ottMajorAdsStuckNearEnd,
    experimentName: 'webott_major_complete_ads_stuck_near_end_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'HILTON' || (__IS_MAJOR_PLATFORM__ && (__OTTPLATFORM__ !== 'FIRETV_HYB' && __OTTPLATFORM__ !== 'TIZEN')),
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
