import type { Store } from 'redux';

import { AutoPlayUIRefreshVariant } from 'common/constants/experiments';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVPlayerUIRefreshAutoPlay: 'webott_firetv_player_ui_refresh_autoplay_v2';
  }
}

TubiExperiments.ottFireTVPlayerUIRefreshAutoPlay = 'webott_firetv_player_ui_refresh_autoplay_v2';

export const getConfig = () => {
  return {
    namespace: 'webott_player_firetv_shared',
    parameter: 'autoplay_refresh_v2',
    id: TubiExperiments.ottFireTVPlayerUIRefreshAutoPlay,
    experimentName: 'webott_firetv_player_ui_refresh_autoplay_v2',
    defaultValue: AutoPlayUIRefreshVariant.Default,
    treatments: [
      { name: 'control', value: AutoPlayUIRefreshVariant.Default },
      { name: 'refresh', value: AutoPlayUIRefreshVariant.Refresh },
      { name: 'refresh_with_add_to_my_list', value: AutoPlayUIRefreshVariant.Refresh_with_add_to_my_list },
    ],
    enabledSelector: () => {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
