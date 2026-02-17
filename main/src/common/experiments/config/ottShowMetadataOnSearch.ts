import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottShowMetadataOnSearch: 'webott_show_metadata_on_search_v2';
  }
}

TubiExperiments.ottShowMetadataOnSearch = 'webott_show_metadata_on_search_v2';

export const SHOW_METADATA_ON_SEARCH = {
  namespace: 'webott_show_metadata_on_search_v2',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...SHOW_METADATA_ON_SEARCH,
    id: TubiExperiments.ottShowMetadataOnSearch,
    experimentName: 'webott_show_metadata_on_search_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_search_metadata', value: true },
    ],
    enabledSelector() {
      return __OTTPLATFORM__ === 'VIZIO';
    },
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
