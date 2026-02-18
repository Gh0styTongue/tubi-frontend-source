import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVBrowseWhileWatchingMovies: 'webott_firetv_browse_while_watching_v2_movies_only_v5';
  }
}

TubiExperiments.ottFireTVBrowseWhileWatchingMovies = 'webott_firetv_browse_while_watching_v2_movies_only_v5';

export const FIRETV_BROWSE_WHILE_WATCHING = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'bww_variant',
};

export enum BWWMoviesVariant {
  CONTROL = 0,
  ROW_VARIANT_1 = 1,
}

export const getConfig = () => {
  return {
    ...FIRETV_BROWSE_WHILE_WATCHING,
    id: TubiExperiments.ottFireTVBrowseWhileWatchingMovies,
    experimentName: 'webott_firetv_browse_while_watching_v2_movies_only_v5',
    defaultValue: 0,
    treatments: [
      { name: 'control', value: BWWMoviesVariant.CONTROL } as const,
      { name: 'row_variant_1', value: BWWMoviesVariant.ROW_VARIANT_1 } as const,

    ],
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
