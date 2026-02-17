import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPs5SkipAdWithHealthscore: 'webott_ps5_skip_ad_with_healthscore_v0';
  }
}

TubiExperiments.ottPs5SkipAdWithHealthscore = 'webott_ps5_skip_ad_with_healthscore_v0';

export enum PS5_SKIP_AD_WITH_HEALTHSCORE_VALUE {
  CONTROL = 'only_error',
  ERROR_OR_HEALTHSCORE = 'error_or_healthscore',
}

export const PS5_SKIP_AD_WITH_HEALTHSCORE = {
  namespace: 'webott_ps5_skip_ad_with_healthscore_v0',
  parameter: 'skip_ad_factor',
};

export const getConfig = () => {
  return {
    ...PS5_SKIP_AD_WITH_HEALTHSCORE,
    id: TubiExperiments.ottPs5SkipAdWithHealthscore,
    experimentName: 'webott_ps5_skip_ad_with_healthscore_v0',
    defaultValue: PS5_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: PS5_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL } as const,
      { name: 'error_or_healthscore', value: PS5_SKIP_AD_WITH_HEALTHSCORE_VALUE.ERROR_OR_HEALTHSCORE } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'PS5',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
