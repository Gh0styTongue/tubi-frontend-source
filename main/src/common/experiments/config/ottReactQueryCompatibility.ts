import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottReactQueryCompatibility: 'webott_react_query_compatibility_v2';
  }
}

TubiExperiments.ottReactQueryCompatibility = 'webott_react_query_compatibility_v2';

export const REACT_QUERY_COMPATIBILITY = {
  namespace: 'webott_react_query_compatibility_v2',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...REACT_QUERY_COMPATIBILITY,
    id: TubiExperiments.ottReactQueryCompatibility,
    experimentName: 'webott_react_query_compatibility_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'with_react_query', value: true },
    ],
    enabledSelector: () => __ISOTT__,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
