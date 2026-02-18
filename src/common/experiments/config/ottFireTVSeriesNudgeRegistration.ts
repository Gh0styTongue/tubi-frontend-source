import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSeriesNudgeRegistration: 'webott_firetv_series_nudge_registration_v1';
  }
}

TubiExperiments.ottFireTVSeriesNudgeRegistration = 'webott_firetv_series_nudge_registration_v1';

export enum FIRETV_SERIES_NUDGE_REGISTRATION_VALUE {
  CONTROL = 'control',
  VALUE_PROPS = 'value_props',
  CONTENT_FORWARD = 'content_forward',
}

export const FIRETV_SERIES_NUDGE_REGISTRATION = {
  namespace: 'webott_firetv_series_nudge_and_video_quality',
  parameter: 'flow',
};

export const getConfig = () => {
  return {
    ...FIRETV_SERIES_NUDGE_REGISTRATION,
    id: TubiExperiments.ottFireTVSeriesNudgeRegistration,
    experimentName: 'webott_firetv_series_nudge_registration_v1',
    defaultValue: FIRETV_SERIES_NUDGE_REGISTRATION_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: FIRETV_SERIES_NUDGE_REGISTRATION_VALUE.CONTROL } as const,
      { name: 'value_props', value: FIRETV_SERIES_NUDGE_REGISTRATION_VALUE.VALUE_PROPS } as const,
      { name: 'content_forward', value: FIRETV_SERIES_NUDGE_REGISTRATION_VALUE.CONTENT_FORWARD } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
