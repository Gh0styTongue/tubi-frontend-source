import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import { hlsNotEnabledVersions } from 'common/selectors/tizen';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungHlsNormalizationUpgrade157: 'webott_samsung_hls_normalization_upgrade_1_5_7_x';
  }
}

TubiExperiments.ottSamsungHlsNormalizationUpgrade157 = 'webott_samsung_hls_normalization_upgrade_1_5_7_x';

export const SAMSUNG_HLS_NORMALIZATION_UPGRADE_1_5_7 = {
  namespace: 'webott_samsung_hls_normalization_upgrade_1_5_7_x',
  parameter: 'use_next',
};

export enum SAMSUNG_HLS_NORMALIZATION_UPGRADE_TREATMENT {
  CONTROL = 0,
  USE_NEXT = 1,
  USE_NEXT_NEVER_NUDGE = 2,
}

export const getConfig = () => {
  return {
    ...SAMSUNG_HLS_NORMALIZATION_UPGRADE_1_5_7,
    id: TubiExperiments.ottSamsungHlsNormalizationUpgrade157,
    experimentName: 'webott_samsung_hls_normalization_upgrade_1_5_7_x',
    defaultValue: 0,
    treatments: [
      { name: 'control', value: SAMSUNG_HLS_NORMALIZATION_UPGRADE_TREATMENT.CONTROL },
      { name: 'use_next', value: SAMSUNG_HLS_NORMALIZATION_UPGRADE_TREATMENT.USE_NEXT },
      { name: 'use_next_never_nudge', value: SAMSUNG_HLS_NORMALIZATION_UPGRADE_TREATMENT.USE_NEXT_NEVER_NUDGE },
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
