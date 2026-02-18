import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPS5PauseAds: 'webott_ps5_pause_ads_v1';
  }
}

TubiExperiments.ottPS5PauseAds = 'webott_ps5_pause_ads_v1';

export const getConfig = () => {
  return {
    namespace: 'webott_player_ps5_shared',
    parameter: 'show_pause_ads',
    id: TubiExperiments.ottPS5PauseAds,
    experimentName: 'webott_ps5_pause_ads_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'enable_pause_ads', value: true } as const,

    ],
    enabledSelector: () => __OTTPLATFORM__ === 'PS5',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
