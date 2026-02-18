import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVVODPlayerRefresh: 'webott_firetv_vod_player_refresh_v2';
  }
}

TubiExperiments.ottFireTVVODPlayerRefresh = 'webott_firetv_vod_player_refresh_v2';

export const FIRETV_VOD_PLAYER_REFRESH = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'player_design',
};

export const getConfig = () => {
  return {
    ...FIRETV_VOD_PLAYER_REFRESH,
    id: TubiExperiments.ottFireTVVODPlayerRefresh,
    experimentName: 'webott_firetv_vod_player_refresh_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'only_progress_bar', value: true },
    ],
    enabledSelector: () => {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
