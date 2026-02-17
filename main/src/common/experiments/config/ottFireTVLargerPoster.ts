import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVLargerPoster: 'webott_firetv_larger_poster_v2';
  }
}

TubiExperiments.ottFireTVLargerPoster = 'webott_firetv_larger_poster_v2';

export const FIRETV_LARGER_POSTER = {
  namespace: 'webott_firetv_larger_poster_v2',
  parameter: 'enable_larger_poster',
};

export const getConfig = () => {
  return {
    ...FIRETV_LARGER_POSTER,
    id: TubiExperiments.ottFireTVLargerPoster,
    experimentName: 'webott_firetv_larger_poster_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_larger_poster', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
