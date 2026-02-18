import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungRemoveUseManifestConfig: 'webott_samsung_remove_use_manifest_config_v1';
  }
}

TubiExperiments.ottSamsungRemoveUseManifestConfig = 'webott_samsung_remove_use_manifest_config_v1';

export const SAMSUNG_REMOVE_USE_MANIFEST_CONFIG = {
  namespace: 'webott_samsung_remove_use_manifest_config_v1',
  parameter: 'enable_no_use_manifest_config',
};

export const getConfig = () => {
  return {
    ...SAMSUNG_REMOVE_USE_MANIFEST_CONFIG,
    id: TubiExperiments.ottSamsungRemoveUseManifestConfig,
    experimentName: 'webott_samsung_remove_use_manifest_config_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_no_use_manifest_config', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
