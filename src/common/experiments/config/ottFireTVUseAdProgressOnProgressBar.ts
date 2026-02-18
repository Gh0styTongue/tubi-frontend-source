import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVUseAdProgressOnProgressBar: 'webott_firetv_show_ad_progress_on_progress_bar';
  }
}

TubiExperiments.ottFireTVUseAdProgressOnProgressBar = 'webott_firetv_show_ad_progress_on_progress_bar';

export const getConfig = () => {
  return {
    namespace: 'webott_player_firetv_shared',
    parameter: 'use_ad_progress',
    id: TubiExperiments.ottFireTVUseAdProgressOnProgressBar,
    experimentName: 'webott_firetv_show_ad_progress_on_progress_bar',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_ad_progress', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
