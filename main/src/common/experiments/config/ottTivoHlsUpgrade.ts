import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottTivoHlsNormalizationUpgrade: 'ottTivoHlsNormalizationUpgrade';
  }
}

TubiExperiments.ottTivoHlsNormalizationUpgrade = 'ottTivoHlsNormalizationUpgrade';

const hlsNextPackageVersion = __HLS_NEXT_PACKAGE_VERSION__ || '';

export const experimentConfig = () => {
  return {
    id: TubiExperiments.ottTivoHlsNormalizationUpgrade,
    namespace: `webott_tivo_hls_normalization_upgrade_${hlsNextPackageVersion}`,
    experimentName: `webott_tivo_hls_normalization_upgrade_${hlsNextPackageVersion}`,
    parameter: 'use_next',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_next', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIVO',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(experimentConfig());
