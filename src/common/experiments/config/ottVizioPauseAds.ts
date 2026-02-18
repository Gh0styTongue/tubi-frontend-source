import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioPauseAds: 'webott_vizio_pause_ads_v0';
  }
}

TubiExperiments.ottVizioPauseAds = 'webott_vizio_pause_ads_v0';

export const getConfig = () => {
  return {
    namespace: 'webott_player_vizio_shared',
    parameter: 'show_pause_ads',
    id: TubiExperiments.ottVizioPauseAds,
    experimentName: 'webott_vizio_pause_ads_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'enable_pause_ads', value: true } as const,

    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
