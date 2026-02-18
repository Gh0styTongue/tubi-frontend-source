import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerFireTVUseHlsAds: 'webott_player_ott_firetv_hls_ads_v1';
  }
}

TubiExperiments.ottPlayerFireTVUseHlsAds = 'webott_player_ott_firetv_hls_ads_v1';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottPlayerFireTVUseHlsAds,
    namespace: 'webott_player_firetv_shared',
    parameter: 'use_hls_ads',
    experimentName: 'webott_player_ott_firetv_hls_ads_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
