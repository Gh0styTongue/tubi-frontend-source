import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVContentNotFound: 'webott_firetv_content_not_found_v1';
  }
}

TubiExperiments.ottFireTVContentNotFound = 'webott_firetv_content_not_found_v1';

export const FIRETV_CONTENT_NOT_FOUND = {
  namespace: 'webott_firetv_content_not_found_v1',
  parameter: 'should_redirect_to_home',
};

export const getConfig = () => {
  return {
    ...FIRETV_CONTENT_NOT_FOUND,
    id: TubiExperiments.ottFireTVContentNotFound,
    experimentName: 'webott_firetv_content_not_found_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'redirect_to_home', value: true },
    ],
    enabledSelector() {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
