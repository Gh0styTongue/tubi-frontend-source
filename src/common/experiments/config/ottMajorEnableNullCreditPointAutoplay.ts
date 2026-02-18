import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorEnableNullCreditPointAutoplay: 'webott_major_enable_null_credit_point_autoplay';
  }
}

TubiExperiments.ottMajorEnableNullCreditPointAutoplay = 'webott_major_enable_null_credit_point_autoplay';

export const MAJOR_ENABLE_NULL_CREDIT_POINT_AUTOPLAY = {
  namespace: 'webott_major_enable_null_credit_point_autoplay',
  parameter: 'enable',
};

export const getConfig = () => {
  return {
    ...MAJOR_ENABLE_NULL_CREDIT_POINT_AUTOPLAY,
    id: TubiExperiments.ottMajorEnableNullCreditPointAutoplay,
    experimentName: 'webott_major_enable_null_credit_point_autoplay',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable', value: true },
    ],
    enabledSelector: () => ['FIRETV_HYB', 'HILTON', 'LGTV', 'VIZIO', 'TIZEN', 'COMCAST'].includes(__OTTPLATFORM__),
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
