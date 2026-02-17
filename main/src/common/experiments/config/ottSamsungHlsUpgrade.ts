import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import { hlsNotEnabledVersions } from 'common/selectors/tizen';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungHlsNormalizationUpgrade157: 'webott_samsung_hls_normalization_upgrade_1_5_7_v1';
  }
}

TubiExperiments.ottSamsungHlsNormalizationUpgrade157 = 'webott_samsung_hls_normalization_upgrade_1_5_7_v1';

export const SAMSUNG_HLS_NORMALIZATION_UPGRADE_1_5_7 = {
  namespace: 'webott_samsung_hls_normalization_upgrade_1_5_7_v1',
  parameter: 'use_next',
};

export const getConfig = () => {
  return {
    ...SAMSUNG_HLS_NORMALIZATION_UPGRADE_1_5_7,
    id: TubiExperiments.ottSamsungHlsNormalizationUpgrade157,
    experimentName: 'webott_samsung_hls_normalization_upgrade_1_5_7_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_next', value: true },
    ],
    enabledSelector: (state: StoreState) => {
      try {
        const userAgent = state.ui.userAgent.ua;
        for (const notEnabledVersion of hlsNotEnabledVersions) {
          if (userAgent.indexOf(`Tizen ${notEnabledVersion}`) !== -1) {
            return false;
          }
        }
      } catch {
        return false;
      }
      return __OTTPLATFORM__ === 'TIZEN';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
