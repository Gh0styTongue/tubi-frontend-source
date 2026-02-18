import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSearchLargerPoster: 'webott_firetv_search_larger_poster';
  }
}

TubiExperiments.ottFireTVSearchLargerPoster = 'webott_firetv_search_larger_poster';

export const FIRETV_SEARCH_LARGER_POSTER = {
  namespace: 'webott_firetv_search_larger_poster',
  parameter: 'larger_poster',
};

export const getConfig = () => {
  return {
    ...FIRETV_SEARCH_LARGER_POSTER,
    id: TubiExperiments.ottFireTVSearchLargerPoster,
    experimentName: 'webott_firetv_search_larger_poster',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'larger_poster', value: true },
    ],
    enabledSelector: () => true,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
