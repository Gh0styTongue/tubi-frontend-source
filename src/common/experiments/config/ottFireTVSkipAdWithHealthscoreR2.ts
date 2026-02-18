import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSkipAdWithHealthscoreR2: 'webott_firetv_skip_ad_with_healthscore_r2_v0';
  }
}

TubiExperiments.ottFireTVSkipAdWithHealthscoreR2 = 'webott_firetv_skip_ad_with_healthscore_r2_v0';

export const FIRETV_SKIP_AD_WITH_HEALTHSCORE_R2 = {
  namespace: 'webott_firetv_skip_ad_with_healthscore_r2_v0',
  parameter: 'healthscore_r2',
};

export const getConfig = () => {
  return {
    ...FIRETV_SKIP_AD_WITH_HEALTHSCORE_R2,
    id: TubiExperiments.ottFireTVSkipAdWithHealthscoreR2,
    experimentName: 'webott_firetv_skip_ad_with_healthscore_r2_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'healthscore_r2', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
