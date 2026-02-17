import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLgtvPauseAds: 'webott_lgtv_pause_ads_v0';
  }
}

TubiExperiments.ottLgtvPauseAds = 'webott_lgtv_pause_ads_v0';

export const getConfig = () => {
  return {
    namespace: 'webott_player_lgtv_shared',
    parameter: 'show_pause_ads',
    id: TubiExperiments.ottLgtvPauseAds,
    experimentName: 'webott_lgtv_pause_ads_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'enable_pause_ads', value: true } as const,

    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
