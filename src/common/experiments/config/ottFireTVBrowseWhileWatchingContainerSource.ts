import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVBrowseWhileWatchingContainerSource: 'webott_firetv_browse_while_watching_container_source_v0';
  }
}

TubiExperiments.ottFireTVBrowseWhileWatchingContainerSource = 'webott_firetv_browse_while_watching_container_source_v0';

export const FIRETV_BROWSE_WHILE_WATCHING = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'bww_source',
};

export const enum BWWContainerSource {
  CONTROL = 'control',
  RECOMMENDED = 'recommended',
  AUTOPLAY = 'autoplay',
  FEATURED = 'featured'
}

export const getConfig = () => {
  return {
    ...FIRETV_BROWSE_WHILE_WATCHING,
    id: TubiExperiments.ottFireTVBrowseWhileWatchingContainerSource,
    experimentName: 'webott_firetv_browse_while_watching_container_source_v0',
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
