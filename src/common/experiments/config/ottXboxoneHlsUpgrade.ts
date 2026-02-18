import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottXboxoneHlsNormalizationUpgrade: 'ottXboxoneHlsNormalizationUpgrade';
  }
}

TubiExperiments.ottXboxoneHlsNormalizationUpgrade = 'ottXboxoneHlsNormalizationUpgrade';

const hlsNextPackageVersion = __HLS_NEXT_PACKAGE_VERSION__ || '';

export const experimentConfig = () => {
  return {
    id: TubiExperiments.ottXboxoneHlsNormalizationUpgrade,
    namespace: `webott_xboxone_hls_normalization_upgrade_${hlsNextPackageVersion}_v4`,
    experimentName: `webott_xboxone_hls_normalization_upgrade_${hlsNextPackageVersion}_v4`,
    parameter: 'use_next',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_next', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'XBOXONE',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(experimentConfig());
