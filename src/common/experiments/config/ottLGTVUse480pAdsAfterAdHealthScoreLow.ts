import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVUse480pAdsAfterAdHealthScoreLow: 'webott_lgtv_use_480p_ads_after_ad_healthscore_low_v0';
  }
}

TubiExperiments.ottLGTVUse480pAdsAfterAdHealthScoreLow = 'webott_lgtv_use_480p_ads_after_ad_healthscore_low_v0';

export const getConfig = () => {
  return {
    namespace: 'webott_lgtv_use_480p_ads_after_ad_healthscore_low',
    parameter: 'use_480p_ads_after_health_score_low',
    id: TubiExperiments.ottLGTVUse480pAdsAfterAdHealthScoreLow,
    experimentName: 'webott_lgtv_use_480p_ads_after_ad_healthscore_low_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_480p_ads_after_health_score_low', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
