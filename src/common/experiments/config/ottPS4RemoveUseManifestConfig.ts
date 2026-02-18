import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPS4RemoveUseManifestConfig: 'webott_ps4_remove_use_manifest_config_v1';
  }
}

TubiExperiments.ottPS4RemoveUseManifestConfig = 'webott_ps4_remove_use_manifest_config_v1';

export const PLAYSTATION_REMOVE_USE_MANIFEST_CONFIG = {
  namespace: 'webott_ps4_remove_use_manifest_config_v1',
  parameter: 'enable_no_use_manifest_config',
};

export const getConfig = () => {
  return {
    ...PLAYSTATION_REMOVE_USE_MANIFEST_CONFIG,
    id: TubiExperiments.ottPS4RemoveUseManifestConfig,
    experimentName: 'webott_ps4_remove_use_manifest_config_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_no_use_manifest_config', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'PS4',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
