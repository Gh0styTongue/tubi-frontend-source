import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsBwwEspanolMode: 'webott_major_platforms_bww_espanol_mode_v0';
  }
}

TubiExperiments.ottMajorPlatformsBwwEspanolMode = 'webott_major_platforms_bww_espanol_mode_v0';

export const BWW_ESPANOL_MODE = {
  // namespace acciedentally matches the experiment name
  namespace: 'webott_major_platforms_bww_espanol_mode_v0',
  parameter: 'enable_bww',
};

export const getConfig = () => {
  return {
    ...BWW_ESPANOL_MODE,
    id: TubiExperiments.ottMajorPlatformsBwwEspanolMode,
    experimentName: 'webott_major_platforms_bww_espanol_mode_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'enabled', value: true } as const,
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
