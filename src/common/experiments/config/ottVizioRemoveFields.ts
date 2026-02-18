import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioRemoveFields: 'webott_vizio_remove_fields_v1';
  }
}

TubiExperiments.ottVizioRemoveFields = 'webott_vizio_remove_fields_v1';

export const VIZIO_REMOVE_FIELDS = {
  namespace: 'webott_vizio_remove_fields_v1',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...VIZIO_REMOVE_FIELDS,
    id: TubiExperiments.ottVizioRemoveFields,
    experimentName: 'webott_vizio_remove_fields_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enabled', value: true },
    ],
    enabledSelector: () => {
      return __OTTPLATFORM__ === 'VIZIO';
    },
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
