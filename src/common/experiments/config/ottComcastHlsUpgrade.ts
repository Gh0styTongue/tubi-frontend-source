import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottComcastHlsNormalizationUpgrade: 'ottComcastHlsNormalizationUpgrade';
  }
}

TubiExperiments.ottComcastHlsNormalizationUpgrade = 'ottComcastHlsNormalizationUpgrade';

const hlsNextPackageVersion = __HLS_NEXT_PACKAGE_VERSION__ || '';

export const experimentConfig = (): ExperimentConfig<boolean, 'control' | 'use_next'> => {
  return {
    id: TubiExperiments.ottComcastHlsNormalizationUpgrade,
    namespace: `webott_comcast_hls_normalization_upgrade_${hlsNextPackageVersion}_v5`,
    experimentName: `webott_comcast_hls_normalization_upgrade_${hlsNextPackageVersion}_v5`,
    parameter: 'use_next',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_next', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'COMCAST',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(experimentConfig());
