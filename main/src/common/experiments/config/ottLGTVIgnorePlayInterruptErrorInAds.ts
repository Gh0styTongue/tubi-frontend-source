import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVIgnoreInterruptErrorInAds: 'webott_lgtv_ignore_play_interrupt_error_in_ads';
  }
}

TubiExperiments.ottLGTVIgnoreInterruptErrorInAds = 'webott_lgtv_ignore_play_interrupt_error_in_ads';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottLGTVIgnoreInterruptErrorInAds,
    namespace: 'webott_lgtv_ignore_play_interrupt_error_in_ads',
    experimentName: 'webott_lgtv_ignore_play_interrupt_error_in_ads',
    parameter: 'ignore',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'ignore', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
