import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVBrowseWhileWatchingSeries: 'webott_firetv_browse_while_watching_series_v2';
  }
}

TubiExperiments.ottFireTVBrowseWhileWatchingSeries = 'webott_firetv_browse_while_watching_series_v2';

export const FIRETV_BROWSE_WHILE_WATCHING = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'bww_series_variant',
};

export enum BWWSeriesVariant {
  CONTROL = 0,
  YMAL_ONLY = 1,
}

export const getConfig = () => {
  return {
    ...FIRETV_BROWSE_WHILE_WATCHING,
    id: TubiExperiments.ottFireTVBrowseWhileWatchingSeries,
    experimentName: 'webott_firetv_browse_while_watching_series_v2',
    defaultValue: 0,
    treatments: [
      { name: 'control', value: BWWSeriesVariant.CONTROL } as const,
      { name: 'ymal_only', value: BWWSeriesVariant.YMAL_ONLY } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
