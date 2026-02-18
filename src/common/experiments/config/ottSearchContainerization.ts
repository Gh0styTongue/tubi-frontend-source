import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSearchContainerization: 'webott_major_platforms_search_containerization';
  }
}

TubiExperiments.ottSearchContainerization = 'webott_major_platforms_search_containerization';

export const SEARCH_CONTAINERIZATION = {
  namespace: 'webott_major_platforms_search_containerization',
  parameter: 'variant',
};

export enum SEARCH_CONTAINERIZATION_VALUE {
  CONTROL = 'control',
  ENABLED_WITH_LARGE_TILES = 'enabled_with_large_tiles',
  ENABLED_WITH_SEARCH_LARGE_TILES = 'enabled_with_search_large_tiles',
}

export const getConfig = () => {
  return {
    ...SEARCH_CONTAINERIZATION,
    id: TubiExperiments.ottSearchContainerization,
    experimentName: 'webott_major_platforms_search_containerization_v1',
    defaultValue: SEARCH_CONTAINERIZATION_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: SEARCH_CONTAINERIZATION_VALUE.CONTROL },
      { name: 'enabled_with_large_tiles', value: SEARCH_CONTAINERIZATION_VALUE.ENABLED_WITH_LARGE_TILES },
      { name: 'enabled_with_search_large_tiles', value: SEARCH_CONTAINERIZATION_VALUE.ENABLED_WITH_SEARCH_LARGE_TILES },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
