import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsPreInitExtension: 'webott_major_platforms_pre_init_extension_v7';
  }
}

TubiExperiments.ottMajorPlatformsPreInitExtension = 'webott_major_platforms_pre_init_extension_v7';

export const MAJOR_PLATFORMS_PRE_INIT_EXTENSION = {
  namespace: 'webott_major_platforms_pre_init_extension_v7',
  parameter: 'enable_pre_init',
};

export const getConfig = () => {
  return {
    ...MAJOR_PLATFORMS_PRE_INIT_EXTENSION,
    id: TubiExperiments.ottMajorPlatformsPreInitExtension,
    experimentName: 'webott_major_platforms_pre_init_extension_v7',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_pre_init', value: true },
    ],
    enabledSelector: () => ['FIRETV_HYB', 'LGTV', 'TIZEN', 'VIZIO', 'COMCAST'].includes(__OTTPLATFORM__),
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
