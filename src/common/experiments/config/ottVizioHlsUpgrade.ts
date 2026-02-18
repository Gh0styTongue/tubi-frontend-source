import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioHlsNormalizationUpgrade: 'ottVizioHlsNormalizationUpgrade';
  }
}

TubiExperiments.ottVizioHlsNormalizationUpgrade = 'ottVizioHlsNormalizationUpgrade';

const hlsNextPackageVersion = __HLS_NEXT_PACKAGE_VERSION__ || '';

export const experimentConfig = () => {
  return {
    id: TubiExperiments.ottVizioHlsNormalizationUpgrade,
    namespace: `webott_vizio_hls_normalization_upgrade_${hlsNextPackageVersion}_v4`,
    experimentName: `webott_vizio_hls_normalization_upgrade_${hlsNextPackageVersion}_v4`,
    parameter: 'use_next',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_next', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(experimentConfig());
