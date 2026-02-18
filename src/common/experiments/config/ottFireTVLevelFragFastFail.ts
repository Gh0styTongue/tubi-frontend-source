import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVLevelFragFastFail: 'webott_firetv_level_frag_fast_fail_v0';
  }
}

TubiExperiments.ottFireTVLevelFragFastFail = 'webott_firetv_level_frag_fast_fail_v0';

export const FIRETV_LEVEL_FRAG_FAST_FAIL = {
  namespace: 'webott_firetv_level_frag_fast_fail_v0',
  parameter: 'fail_faster',
};

export const getConfig = () => {
  return {
    ...FIRETV_LEVEL_FRAG_FAST_FAIL,
    id: TubiExperiments.ottFireTVLevelFragFastFail,
    experimentName: 'webott_firetv_level_frag_fast_fail_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'fail_faster', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
