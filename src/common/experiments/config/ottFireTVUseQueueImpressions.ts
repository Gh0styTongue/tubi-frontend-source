import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVUseQueueImpressions: 'webott_firetv_use_queue_impressions_v0';
  }
}

TubiExperiments.ottFireTVUseQueueImpressions = 'webott_firetv_use_queue_impressions_v0';

export const OTT_FIRETV_USE_QUEUE_IMPRESSIONS = {
  namespace: 'webott_firetv_use_queue_impressions_v0',
  parameter: 'use_queue',
};

export const getConfig = () => {
  return {
    ...OTT_FIRETV_USE_QUEUE_IMPRESSIONS,
    id: TubiExperiments.ottFireTVUseQueueImpressions,
    experimentName: 'webott_firetv_use_queue_impressions_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_queue', value: true },
    ],
    inYoubora: true,
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
