import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVSecondPast: 'webott_lgtv_ads_second_later_v3';
  }
}

TubiExperiments.ottLGTVSecondPast = 'webott_lgtv_ads_second_later_v3';

export const LGTV_SECOND_PAST = {
  namespace: 'webott_lgtv_ads_second_later_v0',
  parameter: 'ads_second_later_no_duplicate',
};

export const getConfig = () => {
  return {
    ...LGTV_SECOND_PAST,
    id: TubiExperiments.ottLGTVSecondPast,
    experimentName: 'webott_lgtv_ads_second_later_v3',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'ads_second_later_no_duplicate', value: true },
    ],
    enabledSelector() {
      return __OTTPLATFORM__ === 'LGTV';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
