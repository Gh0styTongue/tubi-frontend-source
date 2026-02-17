import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioPreInitExtension: 'webott_vizio_pre_init_extension_v1';
  }
}

TubiExperiments.ottVizioPreInitExtension = 'webott_vizio_pre_init_extension_v1';

export const VIZIO_PRE_INIT_EXTENSION = {
  namespace: 'webott_vizio_pre_init_extension_v1',
  parameter: 'enable_pre_init',
};

export const getConfig = () => {
  return {
    ...VIZIO_PRE_INIT_EXTENSION,
    id: TubiExperiments.ottVizioPreInitExtension,
    experimentName: 'webott_vizio_pre_init_extension_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_pre_init', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
