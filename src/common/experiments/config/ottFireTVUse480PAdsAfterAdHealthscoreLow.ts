import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVUse480PAdsAfterAdHealthscoreLow: 'webott_firetv_use_480p_ads_after_ad_healthscore_low';
  }
}

TubiExperiments.ottFireTVUse480PAdsAfterAdHealthscoreLow = 'webott_firetv_use_480p_ads_after_ad_healthscore_low';

export const FIRETV_USE_480P_ADS_AFTER_AD_HEALTHSCORE_LOW = {
  namespace: 'webott_firetv_skip_ad_with_healthscore_r2_v0',
  parameter: 'use_480p_ads_after_health_score_low',
};

export const getConfig = () => {
  return {
    ...FIRETV_USE_480P_ADS_AFTER_AD_HEALTHSCORE_LOW,
    id: TubiExperiments.ottFireTVUse480PAdsAfterAdHealthscoreLow,
    experimentName: 'webott_firetv_use_480p_ads_after_ad_healthscore_low',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_480p_ads_after_health_score_low', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
