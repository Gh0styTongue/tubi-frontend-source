import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPs5HlsNormalizationUpgrade: 'webott_ps5_hls_normalization_upgrade_1_5_7_v2';
  }
}

TubiExperiments.ottPs5HlsNormalizationUpgrade = 'webott_ps5_hls_normalization_upgrade_1_5_7_v2';

export const PS5_HLS_NORMALIZATION_UPGRADE = {
  namespace: 'webott_ps5_hls_normalization_upgrade_1_5_7_v2',
  parameter: 'use_next',
};

export const experimentConfig = () => {
  return {
    ...PS5_HLS_NORMALIZATION_UPGRADE,
    id: TubiExperiments.ottPs5HlsNormalizationUpgrade,
    experimentName: 'webott_ps5_hls_normalization_upgrade_1_5_7_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_next', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'PS5',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(experimentConfig());
