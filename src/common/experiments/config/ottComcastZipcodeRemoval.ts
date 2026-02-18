import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottComcastZipcodeRemoval: 'webott_comcast_zipcode_removal';
  }
}

TubiExperiments.ottComcastZipcodeRemoval = 'webott_comcast_zipcode_removal';

export const COMCAST_ZIPCODE_REMOVAL = {
  namespace: 'webott_comcast_zipcode_removal',
  parameter: 'remove_zipcode',
};

export const getConfig = () => {
  return {
    ...COMCAST_ZIPCODE_REMOVAL,
    id: TubiExperiments.ottComcastZipcodeRemoval,
    experimentName: 'webott_comcast_zipcode_removal',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'remove_zipcode', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'COMCAST',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
