import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottXboxoneSkipAdWithHealthscore: 'webott_xboxone_skip_ad_with_healthscore_v0';
  }
}

TubiExperiments.ottXboxoneSkipAdWithHealthscore = 'webott_xboxone_skip_ad_with_healthscore_v0';

export enum XBOXONE_SKIP_AD_WITH_HEALTHSCORE_VALUE {
  CONTROL = 'only_error',
  ERROR_OR_HEALTHSCORE = 'error_or_healthscore',
}

export const XBOXONE_SKIP_AD_WITH_HEALTHSCORE = {
  namespace: 'webott_xboxone_skip_ad_with_healthscore_v0',
  parameter: 'skip_ad_factor',
};

export const getConfig = () => {
  return {
    ...XBOXONE_SKIP_AD_WITH_HEALTHSCORE,
    id: TubiExperiments.ottXboxoneSkipAdWithHealthscore,
    experimentName: 'webott_xboxone_skip_ad_with_healthscore_v0',
    defaultValue: XBOXONE_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: XBOXONE_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL } as const,
      { name: 'error_or_healthscore', value: XBOXONE_SKIP_AD_WITH_HEALTHSCORE_VALUE.ERROR_OR_HEALTHSCORE } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'XBOXONE',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
