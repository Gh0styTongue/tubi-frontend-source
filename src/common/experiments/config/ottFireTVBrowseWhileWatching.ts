import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVBrowseWhileWatching: 'webott_firetv_browse_while_watching_v3';
  }
}

TubiExperiments.ottFireTVBrowseWhileWatching = 'webott_firetv_browse_while_watching_v3';

export const FIRETV_BROWSE_WHILE_WATCHING = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'enableBrowseWhileWatching',
};

export const getConfig = () => {
  return {
    ...FIRETV_BROWSE_WHILE_WATCHING,
    id: TubiExperiments.ottFireTVBrowseWhileWatching,
    experimentName: 'webott_firetv_browse_while_watching_v3',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'browse_while_watching', value: true } as const,

    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
