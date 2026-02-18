import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorYouMayAlsoLike: 'webott_major_platforms_ymal_v1';
  }
}

TubiExperiments.ottMajorYouMayAlsoLike = 'webott_major_platforms_ymal_v1';

export const MAJOR_YOU_MAY_ALSO_LIKE = {
  namespace: 'webott_major_platforms_ymal',
  parameter: 'enable_ymal',
};

export const getConfig = () => {
  return {
    ...MAJOR_YOU_MAY_ALSO_LIKE,
    id: TubiExperiments.ottMajorYouMayAlsoLike,
    experimentName: 'webott_major_platforms_ymal_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable', value: true },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
