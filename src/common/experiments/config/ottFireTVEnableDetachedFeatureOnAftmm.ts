import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVEnableDetachedFeatureOnAftmm: 'webott_firetrv_enable_detached_feature_on_aftmm_hevc_v3';
  }
}

TubiExperiments.ottFireTVEnableDetachedFeatureOnAftmm = 'webott_firetrv_enable_detached_feature_on_aftmm_hevc_v3';

export const FIRETV_ENABLE_DETACHED_FEATURE_ON_AFTMM = {
  namespace: 'webott_firetrv_enable_detached_feature_on_aftmm_hevc_v3',
  parameter: 'enable_detached_feature',
};

export const getConfig = () => {
  return {
    ...FIRETV_ENABLE_DETACHED_FEATURE_ON_AFTMM,
    id: TubiExperiments.ottFireTVEnableDetachedFeatureOnAftmm,
    experimentName: 'webott_firetrv_enable_detached_feature_on_aftmm_hevc_v3',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_detached_feature', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
