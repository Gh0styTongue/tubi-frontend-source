import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVPostponeThumbnailFetch: 'webott_firetv_postpone_thumbnail_fetch_v1';
  }
}

TubiExperiments.ottFireTVPostponeThumbnailFetch = 'webott_firetv_postpone_thumbnail_fetch_v1';

export const FIRETV_POSTPONE_THUMBNAIL_FETCH = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'postpone_thumbnail_fetch',
};

export const getConfig = () => {
  return {
    ...FIRETV_POSTPONE_THUMBNAIL_FETCH,
    id: TubiExperiments.ottFireTVPostponeThumbnailFetch,
    experimentName: 'webott_firetv_postpone_thumbnail_fetch_v1',
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'postpone_thumbnail_fetch', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
