import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerLGTVNoDuplicateImpressions: 'webott_player_ott_lgtv_no_duplicate_impressions_v0';
  }
}

TubiExperiments.ottPlayerLGTVNoDuplicateImpressions = 'webott_player_ott_lgtv_no_duplicate_impressions_v0';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottPlayerLGTVNoDuplicateImpressions,
    namespace: 'webott_player_ott_lgtv_no_duplicate_impressions_v0',
    parameter: 'no_duplicates',
    experimentName: 'webott_player_ott_lgtv_no_duplicate_impressions_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'no_duplicates', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
