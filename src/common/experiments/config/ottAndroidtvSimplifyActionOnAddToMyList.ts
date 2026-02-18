import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottAndroidtvSimplifyActionOnAddToMyList: 'webott_androidtv_simplify_action_on_add_to_my_list';
  }
}

TubiExperiments.ottAndroidtvSimplifyActionOnAddToMyList = 'webott_androidtv_simplify_action_on_add_to_my_list';

export const ANDROIDTV_SIMPLIFY_ACTION_ON_ADD_TO_MY_LIST = {
  namespace: 'webott_androidtv_simplify_action_on_add_to_my_list',
  parameter: 'simplified',
};

export const getConfig = () => {
  return {
    ...ANDROIDTV_SIMPLIFY_ACTION_ON_ADD_TO_MY_LIST,
    id: TubiExperiments.ottAndroidtvSimplifyActionOnAddToMyList,
    experimentName: 'webott_androidtv_simplify_action_on_add_to_my_list',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'simplified', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
