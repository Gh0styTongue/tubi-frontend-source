import type { Store } from 'redux';

import { BWWContainerSource } from 'common/experiments/config/ottFireTVBrowseWhileWatchingContainerSource';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVBrowseWhileWatchingContainerSourceSeries: 'webott_firetv_browse_while_watching_container_source_series_v1';
  }
}

TubiExperiments.ottFireTVBrowseWhileWatchingContainerSourceSeries = 'webott_firetv_browse_while_watching_container_source_series_v1';

export const FIRETV_BROWSE_WHILE_WATCHING = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'bww_source',
};

export const getConfig = () => {
  return {
    ...FIRETV_BROWSE_WHILE_WATCHING,
    id: TubiExperiments.ottFireTVBrowseWhileWatchingContainerSourceSeries,
    experimentName: 'webott_firetv_browse_while_watching_container_source_series_v1',
    defaultValue: 'control',
    treatments: [
      { name: 'control', value: BWWContainerSource.CONTROL } as const,
      { name: 'recommended', value: BWWContainerSource.RECOMMENDED } as const,
      { name: 'autoplay', value: BWWContainerSource.AUTOPLAY } as const,
      { name: 'featured', value: BWWContainerSource.FEATURED } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
