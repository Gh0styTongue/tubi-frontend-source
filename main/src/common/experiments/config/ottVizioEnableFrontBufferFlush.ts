import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioEnableFrontBufferFlush: 'webott_vizio_enable_front_buffer_flush';
  }
}

TubiExperiments.ottVizioEnableFrontBufferFlush = 'webott_vizio_enable_front_buffer_flush';

export const VIZIO_ENABLE_FRONT_BUFFER_FLUSH = {
  namespace: 'webott_player_vizio_shared',
  parameter: 'enable_forward_buffer_flush',
};

export const getConfig = () => {
  return {
    ...VIZIO_ENABLE_FRONT_BUFFER_FLUSH,
    id: TubiExperiments.ottVizioEnableFrontBufferFlush,
    experimentName: 'webott_vizio_enable_front_buffer_flush',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_forward_buffer_flush', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
