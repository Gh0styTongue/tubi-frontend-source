import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerHisenseUseHlsAds: 'webott_player_ott_hisense_hls_ads_v1';
  }
}

TubiExperiments.ottPlayerHisenseUseHlsAds = 'webott_player_ott_hisense_hls_ads_v1';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottPlayerHisenseUseHlsAds,
    namespace: 'webott_player_ott_hisense_hls_ads_v0',
    parameter: 'use_hls_ads',
    experimentName: 'webott_player_ott_hisense_hls_ads_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'HISENSE',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
