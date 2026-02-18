import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVDirectlyToLinearPlayer: 'webott_firetv_directly_to_linear_player';
  }
}

TubiExperiments.ottFireTVDirectlyToLinearPlayer = 'webott_firetv_directly_to_linear_player';

export const FIRETV_DIRECTLY_TO_LINEAR_PLAYER = {
  namespace: 'webott_firetv_directly_to_linear_player',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_DIRECTLY_TO_LINEAR_PLAYER,
    id: TubiExperiments.ottFireTVDirectlyToLinearPlayer,
    experimentName: 'webott_firetv_directly_to_linear_player',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'directly_to_player', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
