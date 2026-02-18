import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';
declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSkipAdWithHealthscore: 'webott_firetv_skip_ad_with_healthscore_v2';
  }
}

TubiExperiments.ottFireTVSkipAdWithHealthscore = 'webott_firetv_skip_ad_with_healthscore_v2';

export enum FIRETV_SKIP_AD_WITH_HEALTHSCORE_VALUE {
  CONTROL = 'only_error',
  ERROR_OR_HEALTHSCORE = 'error_or_healthscore',
}

export const FIRETV_SKIP_AD_WITH_HEALTHSCORE = {
  namespace: 'webott_firetv_skip_ad_with_healthscore_v2',
  parameter: 'skip_ad_factor',
};

export const getConfig = () => {
  return {
    ...FIRETV_SKIP_AD_WITH_HEALTHSCORE,
    id: TubiExperiments.ottFireTVSkipAdWithHealthscore,
    experimentName: 'webott_firetv_skip_ad_with_healthscore_v2',
    defaultValue: FIRETV_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: FIRETV_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL } as const,
      { name: 'error_or_healthscore', value: FIRETV_SKIP_AD_WITH_HEALTHSCORE_VALUE.ERROR_OR_HEALTHSCORE } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
