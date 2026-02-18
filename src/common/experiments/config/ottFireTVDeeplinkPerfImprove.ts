import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVDeeplinkPerfImprove: 'webott_firetv_deeplink_perf_improve';
  }
}

TubiExperiments.ottFireTVDeeplinkPerfImprove = 'webott_firetv_deeplink_perf_improve';

export const FIRETV_DEEPLINK_PERF_IMPROVE = {
  namespace: 'webott_firetv_deeplink_perf_improve',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_DEEPLINK_PERF_IMPROVE,
    id: TubiExperiments.ottFireTVDeeplinkPerfImprove,
    experimentName: 'webott_firetv_deeplink_perf_improve',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_skeleton', value: true },
    ],
    enabledSelector: () => true,
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
