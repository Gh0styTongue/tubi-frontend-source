import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVHlsNormalizationUpgrade: 'ottLGTVHlsNormalizationUpgrade';
  }
}

TubiExperiments.ottLGTVHlsNormalizationUpgrade = 'ottLGTVHlsNormalizationUpgrade';

const hlsNextPackageVersion = __HLS_NEXT_PACKAGE_VERSION__ || '';

export const experimentConfig = (): ExperimentConfig<boolean, 'control' | 'use_next'> => {
  return {
    id: TubiExperiments.ottLGTVHlsNormalizationUpgrade,
    namespace: `webott_lgtv_hls_normalization_upgrade_${hlsNextPackageVersion}_v4`,
    experimentName: `webott_lgtv_hls_normalization_upgrade_${hlsNextPackageVersion}_v4`,
    parameter: 'use_next',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_next', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
    inYoubora: true,
  };
};
export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(experimentConfig());
