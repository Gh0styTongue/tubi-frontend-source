import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottXboxoneRemoveUseManifestConfig: 'webott_xboxone_remove_use_manifest_config_v1';
  }
}

TubiExperiments.ottXboxoneRemoveUseManifestConfig = 'webott_xboxone_remove_use_manifest_config_v1';

export const XBOXONE_REMOVE_USE_MANIFEST_CONFIG = {
  namespace: 'webott_xboxone_remove_use_manifest_config_v1',
  parameter: 'enable_no_use_manifest_config',
};

export const getConfig = () => {
  return {
    ...XBOXONE_REMOVE_USE_MANIFEST_CONFIG,
    id: TubiExperiments.ottXboxoneRemoveUseManifestConfig,
    experimentName: 'webott_xboxone_remove_use_manifest_config_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_no_use_manifest_config', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'XBOXONE',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
