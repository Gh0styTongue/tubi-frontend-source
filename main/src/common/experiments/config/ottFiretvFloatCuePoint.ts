import type { Store } from 'redux';

import { FIRETV_FLOAT_CUE_POINT_VALUE } from 'common/constants/experiments';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';
declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFiretvFloatCuePoint: 'webott_firetv_float_cue_point_v6';
  }
}

TubiExperiments.ottFiretvFloatCuePoint = 'webott_firetv_float_cue_point_v6';

export const FIRETV_FLOAT_CUE_POINT_NAMESPACE = {
  namespace: 'ads_configuration_webott_firetv_shared',
  parameter: 'cue_point_mode_v6',
};

export const getConfig = () => {
  return {
    ...FIRETV_FLOAT_CUE_POINT_NAMESPACE,
    id: TubiExperiments.ottFiretvFloatCuePoint,
    experimentName: 'webott_firetv_float_cue_point_v6',
    defaultValue: FIRETV_FLOAT_CUE_POINT_VALUE.INTEGER_CUE_POINT,
    treatments: [
      { name: 'control', value: FIRETV_FLOAT_CUE_POINT_VALUE.INTEGER_CUE_POINT },
      { name: 'text_track', value: FIRETV_FLOAT_CUE_POINT_VALUE.FLOAT_CUE_POINT_WITH_TEXT_TRACK },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
