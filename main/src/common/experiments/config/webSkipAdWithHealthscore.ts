import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webSkipAdWithHealthscore: 'webott_web_skip_ad_with_healthscore_v0';
  }
}

TubiExperiments.webSkipAdWithHealthscore = 'webott_web_skip_ad_with_healthscore_v0';

export enum WEB_SKIP_AD_WITH_HEALTHSCORE_VALUE {
  CONTROL = 'only_error',
  ERROR_OR_HEALTHSCORE = 'error_or_healthscore',
}

export const WEB_SKIP_AD_WITH_HEALTHSCORE = {
  namespace: 'webott_web_skip_ad_with_healthscore_v0',
  parameter: 'skip_ad_factor',
};

export const getConfig = () => {
  return {
    ...WEB_SKIP_AD_WITH_HEALTHSCORE,
    id: TubiExperiments.webSkipAdWithHealthscore,
    experimentName: 'webott_web_skip_ad_with_healthscore_v0',
    defaultValue: WEB_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: WEB_SKIP_AD_WITH_HEALTHSCORE_VALUE.CONTROL } as const,
      { name: 'error_or_healthscore', value: WEB_SKIP_AD_WITH_HEALTHSCORE_VALUE.ERROR_OR_HEALTHSCORE } as const,
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
