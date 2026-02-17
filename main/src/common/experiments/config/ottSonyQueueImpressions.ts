import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSonyQueueImpressions: 'webott_sony_use_queue_impressions_v0';
  }
}

TubiExperiments.ottSonyQueueImpressions = 'webott_sony_use_queue_impressions_v0';

export const SONY_QUEUE_IMPRESSIONS = {
  namespace: 'webott_sony_use_queue_impressions_v0',
  parameter: 'use_queue',
};

export const getConfig = () => {
  return {
    ...SONY_QUEUE_IMPRESSIONS,
    id: TubiExperiments.ottSonyQueueImpressions,
    experimentName: 'webott_sony_use_queue_impressions_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'SONY',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
