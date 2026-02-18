import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsCreatorverse: 'webott_major_platforms_creatorverse';
  }
}

TubiExperiments.ottMajorPlatformsCreatorverse = 'webott_major_platforms_creatorverse';

export const MAJOR_PLATFORMS_CREATORVERSE = {
  namespace: 'webott_major_platforms_creatorverse',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...MAJOR_PLATFORMS_CREATORVERSE,
    id: TubiExperiments.ottMajorPlatformsCreatorverse,
    experimentName: 'webott_major_platforms_creatorverse',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'with_creatorverse', value: true },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
