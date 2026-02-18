import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottUnpinMyListAndHistoryContainerOnCategories: 'webott_unpin_my_list_and_history_container_on_categories';
  }
}

TubiExperiments.ottUnpinMyListAndHistoryContainerOnCategories = 'webott_unpin_my_list_and_history_container_on_categories';

export const UNPIN_MY_LIST_AND_HISTORY_CONTAINER_ON_CATEGORIES = {
  namespace: 'webott_unpin_my_list_and_history_container_on_categories',
  parameter: 'unpin',
};

export const getConfig = () => {
  return {
    ...UNPIN_MY_LIST_AND_HISTORY_CONTAINER_ON_CATEGORIES,
    id: TubiExperiments.ottUnpinMyListAndHistoryContainerOnCategories,
    experimentName: 'webott_unpin_my_list_and_history_container_on_categories_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'unpin_my_list_and_history_container', value: true },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
