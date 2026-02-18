import type { Store } from 'redux';

import { AutoPlayUIRefreshVariant } from 'common/constants/experiments';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlayerUIRefresh: 'webott_player_ui_refresh_autoplay_on_major_platforms_v3';
  }
}

TubiExperiments.ottMajorPlayerUIRefresh = 'webott_player_ui_refresh_autoplay_on_major_platforms_v3';

export const OTT_MAJOR_PLAYER_UI_REFRESH = {
  namespace: 'webott_player_ui_refresh_autoplay_on_major_platforms',
  parameter: 'refresh_variant_v3',
};

export const getConfig = () => {
  return {
    ...OTT_MAJOR_PLAYER_UI_REFRESH,
    id: TubiExperiments.ottMajorPlayerUIRefresh,
    experimentName: 'webott_player_ui_refresh_autoplay_on_major_platforms_v3',
    defaultValue: AutoPlayUIRefreshVariant.Default,
    inYoubora: true,
    treatments: [
      { name: 'control', value: AutoPlayUIRefreshVariant.Default },
      { name: 'refresh', value: AutoPlayUIRefreshVariant.Refresh },
      { name: 'refresh_aggressive', value: AutoPlayUIRefreshVariant.Refresh_aggressive },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
