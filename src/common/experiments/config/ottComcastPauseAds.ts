import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottComcastPauseAds: 'webott_comcast_pause_ads_v0point5';
  }
}

TubiExperiments.ottComcastPauseAds = 'webott_comcast_pause_ads_v0point5';

export const getConfig = () => {
  return {
    namespace: 'webott_player_comcast_shared',
    parameter: 'show_pause_ads',
    id: TubiExperiments.ottComcastPauseAds,
    experimentName: 'webott_comcast_pause_ads_v0point5',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'enable_pause_ads', value: true } as const,

    ],
    enabledSelector: () => __OTTPLATFORM__ === 'COMCAST',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
