import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerUIRefreshAutoPlay: 'webott_player_ui_refresh_autoplay_on_major_platforms_v0';
  }
}

TubiExperiments.ottPlayerUIRefreshAutoPlay = 'webott_player_ui_refresh_autoplay_on_major_platforms_v0';

export const getConfig = () => {
  return {
    namespace: 'webott_player_ui_refresh_autoplay_on_major_platforms',
    parameter: 'refresh',
    id: TubiExperiments.ottPlayerUIRefreshAutoPlay,
    experimentName: 'webott_player_ui_refresh_autoplay_on_major_platforms_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'refresh', value: true },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__ && __OTTPLATFORM__ !== 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
