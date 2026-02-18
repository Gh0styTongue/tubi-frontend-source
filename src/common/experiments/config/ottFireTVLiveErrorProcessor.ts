import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVLiveErrorProcessor: 'webott_firetv_live_error_processor';
  }
}

TubiExperiments.ottFireTVLiveErrorProcessor = 'webott_firetv_live_error_processor';

export const FIRETV_LIVE_ERROR_PROCESSOR = {
  namespace: 'webott_firetv_live_error_processor',
  parameter: 'enable_error_processor',
};

export const getConfig = () => {
  return {
    ...FIRETV_LIVE_ERROR_PROCESSOR,
    id: TubiExperiments.ottFireTVLiveErrorProcessor,
    experimentName: 'webott_firetv_live_error_processor',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_error_processor', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
