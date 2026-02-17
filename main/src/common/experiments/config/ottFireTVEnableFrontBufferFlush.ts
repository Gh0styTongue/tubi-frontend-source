import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVEnableFrontBufferFlush: 'webott_firetv_enable_front_buffer_flush_v1';
  }
}

TubiExperiments.ottFireTVEnableFrontBufferFlush = 'webott_firetv_enable_front_buffer_flush_v1';

export enum FLUSH_MODE {
  CONTROL = 0,
  ENABLE_FRONT_FLUSH = 1,
  ENABLE_FRONT_AND_BACK_FLUSH = 2,
  NEVER_FLUSH = 3
}

export const FIRETV_ENABLE_FRONT_BUFFER_FLUSH = {
  namespace: 'webott_firetv_enable_front_buffer_flush_v1',
  parameter: 'enable_flush_mode',
};

export const getConfig = () => {
  return {
    ...FIRETV_ENABLE_FRONT_BUFFER_FLUSH,
    id: TubiExperiments.ottFireTVEnableFrontBufferFlush,
    experimentName: 'webott_firetv_enable_front_buffer_flush_v1',
    defaultValue: FLUSH_MODE.CONTROL,
    treatments: [
      { name: 'control', value: FLUSH_MODE.CONTROL },
      { name: 'enable_front_flush', value: FLUSH_MODE.ENABLE_FRONT_FLUSH },
      { name: 'enable_front_and_back_flush', value: FLUSH_MODE.ENABLE_FRONT_AND_BACK_FLUSH },
      { name: 'never_flush', value: FLUSH_MODE.NEVER_FLUSH },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
