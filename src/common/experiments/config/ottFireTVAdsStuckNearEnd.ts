import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVAdsStuckNearEnd: 'webott_firetv_complete_ads_stuck_near_end_v0';
  }
}

TubiExperiments.ottFireTVAdsStuckNearEnd = 'webott_firetv_complete_ads_stuck_near_end_v0';

export const FIRETV_ADS_STUCK_NEAR_END = {
  namespace: 'webott_firetv_complete_ads_stuck_near_end_v0',
  parameter: 'complete_ads_stuck_near_end',
};

export const getConfig = () => {
  return {
    ...FIRETV_ADS_STUCK_NEAR_END,
    id: TubiExperiments.ottFireTVAdsStuckNearEnd,
    experimentName: 'webott_firetv_complete_ads_stuck_near_end_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
