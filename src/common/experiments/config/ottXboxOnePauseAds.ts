import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottXboxOnePauseAds: 'webott_xboxone_pause_ads_v1';
  }
}

TubiExperiments.ottXboxOnePauseAds = 'webott_xboxone_pause_ads_v1';

export const getConfig = () => {
  return {
    namespace: 'webott_player_xboxone_shared',
    parameter: 'show_pause_ads',
    id: TubiExperiments.ottXboxOnePauseAds,
    experimentName: 'webott_xboxone_pause_ads_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'enable_pause_ads', value: true } as const,

    ],
    enabledSelector: () => __OTTPLATFORM__ === 'XBOXONE',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
