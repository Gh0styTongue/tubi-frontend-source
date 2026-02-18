import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSimplifyActionOnAddToMyList: 'webott_firetv_simplify_action_on_add_to_my_list';
  }
}

TubiExperiments.ottFireTVSimplifyActionOnAddToMyList = 'webott_firetv_simplify_action_on_add_to_my_list';

export const FIRETV_SIMPLIFY_ACTION_ON_ADD_TO_MY_LIST = {
  namespace: 'webott_firetv_simplify_action_on_add_to_my_list',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_SIMPLIFY_ACTION_ON_ADD_TO_MY_LIST,
    id: TubiExperiments.ottFireTVSimplifyActionOnAddToMyList,
    experimentName: 'webott_firetv_simplify_action_on_add_to_my_list',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'simplified', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
