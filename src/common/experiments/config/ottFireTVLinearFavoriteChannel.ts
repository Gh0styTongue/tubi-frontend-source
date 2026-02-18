import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVLinearFavoriteChannel: 'webott_firetv_linear_favorite_channel';
  }
}

TubiExperiments.ottFireTVLinearFavoriteChannel = 'webott_firetv_linear_favorite_channel';

export const FIRETV_LINEAR_FAVORITE_CHANNEL = {
  namespace: 'webott_firetv_linear_favorite_channel',
  parameter: 'use_new_style',
};

export const getConfig = () => {
  return {
    ...FIRETV_LINEAR_FAVORITE_CHANNEL,
    id: TubiExperiments.ottFireTVLinearFavoriteChannel,
    experimentName: 'webott_firetv_linear_favorite_channel',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_new_style', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
