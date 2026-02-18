import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsBrowseWhileWatchingContainerSourceSeries: 'webott_major_platforms_browse_while_watching_container_source_series_v0';
  }
}

TubiExperiments.ottMajorPlatformsBrowseWhileWatchingContainerSourceSeries = 'webott_major_platforms_browse_while_watching_container_source_series_v0';

export const BROWSE_WHILE_WATCHING_CONTAINER_SOURCE = {
  namespace: 'webott_player_major_platforms_shared',
  parameter: 'bww_source',
};

export const enum BWWContainerSource {
  CONTROL = 'control',
  RECOMMENDED = 'recommended',
  RECOMMENDED_TV = 'recommended_tv',
}

export const getConfig = () => {
  return {
    ...BROWSE_WHILE_WATCHING_CONTAINER_SOURCE,
    id: TubiExperiments.ottMajorPlatformsBrowseWhileWatchingContainerSourceSeries,
    experimentName: 'webott_major_platforms_browse_while_watching_container_source_series_v0',
    defaultValue: BWWContainerSource.CONTROL,
    treatments: [
      { name: 'control', value: BWWContainerSource.CONTROL },
      { name: 'recommended', value: BWWContainerSource.RECOMMENDED },
      { name: 'recommended_tv', value: BWWContainerSource.RECOMMENDED_TV },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
