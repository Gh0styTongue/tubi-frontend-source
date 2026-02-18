import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import { useHlsSelector } from 'common/selectors/tizen';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerSamsungUseHlsAdsPreloading: 'webott_player_ott_samsung_hls_ads_preloading_v0';
  }
}

TubiExperiments.ottPlayerSamsungUseHlsAdsPreloading = 'webott_player_ott_samsung_hls_ads_preloading_v0';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottPlayerSamsungUseHlsAdsPreloading,
    namespace: 'webott_player_samsung_shared',
    parameter: 'use_hls_ads_preloading',
    experimentName: 'webott_player_ott_samsung_hls_ads_preloading_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: useHlsSelector,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
