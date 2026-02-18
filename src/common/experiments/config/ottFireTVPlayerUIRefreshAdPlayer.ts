import type { Store } from 'redux';

import { AdPlayerUIRefreshVariant } from 'common/constants/experiments';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';
declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVPlayerUIRefreshAdPlayer: 'webott_firetv_player_ui_refresh_ad_player_v2';
  }
}

TubiExperiments.ottFireTVPlayerUIRefreshAdPlayer = 'webott_firetv_player_ui_refresh_ad_player_v2';

export const getConfig = () => {
  return {
    namespace: 'webott_player_firetv_shared',
    parameter: 'ad_player_variant_v2',
    id: TubiExperiments.ottFireTVPlayerUIRefreshAdPlayer,
    experimentName: 'webott_firetv_player_ui_refresh_ad_player_v2',
    defaultValue: AdPlayerUIRefreshVariant.Default,
    treatments: [
      { name: 'control', value: AdPlayerUIRefreshVariant.Default } as const,
      { name: 'single_ad_time_clean', value: AdPlayerUIRefreshVariant.V1 } as const,
      { name: 'all_ad_time_clean', value: AdPlayerUIRefreshVariant.V2 } as const,
      { name: 'all_ad_time', value: AdPlayerUIRefreshVariant.V3 } as const,
      { name: 'single_ad_time', value: AdPlayerUIRefreshVariant.V4 } as const,
    ],
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
