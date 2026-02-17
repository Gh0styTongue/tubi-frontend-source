import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVGate1080pResolution: 'webott_firetv_gate_1080p_res_v1';
  }
}

TubiExperiments.ottFireTVGate1080pResolution = 'webott_firetv_gate_1080p_res_v1';

export const FIRETV_GATE_1080P_RESOLUTION = {
  namespace: 'webott_firetv_series_nudge_and_video_quality',
  parameter: 'gate_1080p_resolution',
};

export enum FIRETV_GATE_1080P_VALUE {
  CONTROL = 0,
  UI_WITHOUT_REGISTRATION = 1,
  UI_WITH_REGISTRATION = 2,
}

export const MAX_LEVEL_RESOLUTION = 1000;

export type TreatmentName = 'control' | 'ui_without_registration' | 'ui_with_registration';

export const getConfig = (): ExperimentConfig<FIRETV_GATE_1080P_VALUE, TreatmentName> => {
  return {
    ...FIRETV_GATE_1080P_RESOLUTION,
    id: TubiExperiments.ottFireTVGate1080pResolution,
    experimentName: 'webott_firetv_gate_1080p_res_v1',
    defaultValue: FIRETV_GATE_1080P_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: FIRETV_GATE_1080P_VALUE.CONTROL },
      { name: 'ui_without_registration', value: FIRETV_GATE_1080P_VALUE.UI_WITHOUT_REGISTRATION },
      { name: 'ui_with_registration', value: FIRETV_GATE_1080P_VALUE.UI_WITH_REGISTRATION },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
