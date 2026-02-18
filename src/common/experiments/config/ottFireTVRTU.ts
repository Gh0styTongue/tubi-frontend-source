import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVRTU: 'webott_firetv_rtu_v1';
  }
}

TubiExperiments.ottFireTVRTU = 'webott_firetv_rtu_v1';

export const FIRETV_RTU_PARAM = {
  namespace: 'webott_firetv_rtu_v1',
  parameter: 'rtu_strategy',
};

export enum FIRETV_RTU {
  CONTROL = 0,
  DISABLE_INTRO_TEN_MIN = 1,
  DISABLE_INTRO_LOAD_HOMESCREEN_LATER = 2,
}

export type TreatmentName = 'control' | 'disable_intro_ten_min' | 'disable_intro_load_homescreen_later';

export const getConfig = (): ExperimentConfig<FIRETV_RTU, TreatmentName> => {
  return {
    ...FIRETV_RTU_PARAM,
    id: TubiExperiments.ottFireTVRTU,
    experimentName: 'webott_firetv_rtu_v1',
    defaultValue: FIRETV_RTU.CONTROL,
    treatments: [
      { name: 'control', value: FIRETV_RTU.CONTROL },
      { name: 'disable_intro_ten_min', value: FIRETV_RTU.DISABLE_INTRO_TEN_MIN },
      { name: 'disable_intro_load_homescreen_later', value: FIRETV_RTU.DISABLE_INTRO_LOAD_HOMESCREEN_LATER },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
