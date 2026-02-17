import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottComcastSkipAdWithHealthscore: 'webott_comcast_skip_ad_with_healthscore_v0';
  }
}

TubiExperiments.ottComcastSkipAdWithHealthscore = 'webott_comcast_skip_ad_with_healthscore_v0';

export enum COMCAST_SKIP_AD_WITH_HEALTHSCORE_VALUE {
  CONTROL = 'only_error',
  ERROR_OR_HEALTHSCORE = 'error_or_healthscore',
}

export const COMCAST_SKIP_AD_WITH_HEALTHSCORE = {
  namespace: 'webott_comcast_skip_ad_with_healthscore_v0',
  parameter: 'skip_ad_factor',
};

export const getConfig = () => {
  return {
    ...COMCAST_SKIP_AD_WITH_HEALTHSCORE,
    id: TubiExperiments.ottComcastSkipAdWithHealthscore,
    experimentName: 'webott_comcast_skip_ad_with_healthscore_v0',
    defaultValue: COMCAST_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: COMCAST_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL } as const,
      { name: 'error_or_healthscore', value: COMCAST_SKIP_AD_WITH_HEALTHSCORE_VALUE.ERROR_OR_HEALTHSCORE } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'COMCAST',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
