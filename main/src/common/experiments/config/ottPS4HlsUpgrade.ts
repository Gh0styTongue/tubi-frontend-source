import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPs4HlsUpgrade: 'webott_ps4_hls_normalization_upgrade_1_5_7_v1';
  }
}

TubiExperiments.ottPs4HlsUpgrade = 'webott_ps4_hls_normalization_upgrade_1_5_7_v1';

export const ottPs4HlsUpgrade = {
  namespace: 'webott_ps4_hls_normalization_upgrade_1_5_7_v1',
  parameter: 'use_next',
};

export const getConfig = () => {
  return {
    ...ottPs4HlsUpgrade,
    id: TubiExperiments.ottPs4HlsUpgrade,
    experimentName: 'webott_ps4_hls_normalization_upgrade_1_5_7_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_next', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'PS4',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
