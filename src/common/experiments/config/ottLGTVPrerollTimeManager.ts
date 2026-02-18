import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVPrerollTimeManager: 'webott_lgtv_preroll_load_time_manager';
  }
}

TubiExperiments.ottLGTVPrerollTimeManager = 'webott_lgtv_preroll_load_time_manager';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottLGTVPrerollTimeManager,
    namespace: 'webott_lgtv_preroll_load_time_manager',
    experimentName: 'webott_lgtv_preroll_load_time_manager',
    parameter: 'skip',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'skip', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
