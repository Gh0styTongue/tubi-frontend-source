import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioHandleAdStallAtStart: 'webott_vizio_handle_ad_stall_at_start';
  }
}

TubiExperiments.ottVizioHandleAdStallAtStart = 'webott_vizio_handle_ad_stall_at_start';

export const getConfig = () => {
  return {
    namespace: 'webott_vizio_handle_ad_stall_at_start',
    parameter: 'skip',
    id: TubiExperiments.ottVizioHandleAdStallAtStart,
    experimentName: 'webott_vizio_handle_ad_stall_at_start',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'skip', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
