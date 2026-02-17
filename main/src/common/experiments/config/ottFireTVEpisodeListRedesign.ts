import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVEpisodeListRedesign: 'webott_firetv_episode_list_redesign_v2';
  }
}

TubiExperiments.ottFireTVEpisodeListRedesign = 'webott_firetv_episode_list_redesign_v2';

export const FIRETV_EPISODE_LIST_REDESIGN = {
  namespace: 'webott_firetv_episode_list_redesign',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_EPISODE_LIST_REDESIGN,
    id: TubiExperiments.ottFireTVEpisodeListRedesign,
    experimentName: 'webott_firetv_episode_list_redesign_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'redesign', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
