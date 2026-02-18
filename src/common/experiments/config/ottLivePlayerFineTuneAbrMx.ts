import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLivePlayerFineTuneAbrMx: 'webott_live_player_fine_tune_abr_mx';
  }
}

TubiExperiments.ottLivePlayerFineTuneAbrMx = 'webott_live_player_fine_tune_abr_mx';

export const LIVE_PLAYER_FINE_TUNE_ABR_MX = {
  namespace: 'webott_live_player_fine_tune_abr_mx',
  parameter: 'abr_fine_tuning',
};

export const getConfig = () => {
  return {
    ...LIVE_PLAYER_FINE_TUNE_ABR_MX,
    id: TubiExperiments.ottLivePlayerFineTuneAbrMx,
    experimentName: 'webott_live_player_fine_tune_abr_mx',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'abr_fine_tuning', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
