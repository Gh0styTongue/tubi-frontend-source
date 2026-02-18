import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsDelayLoadHomescreen: 'webott_major_platforms_delay_load_homescreen_v1';
  }
}

TubiExperiments.ottMajorPlatformsDelayLoadHomescreen = 'webott_major_platforms_delay_load_homescreen_v1';

export const DELAY_LOAD_HOMESCREEN_EXPERIMENT_PARAM = {
  namespace: 'webott_major_platforms_delay_load_homescreen_v1',
  parameter: 'delay_load_homescreen_strategy',
};

export enum DELAY_LOAD_HOMESCREEN_PARAM {
  CONTROL = 0,
  DELAY_LOAD_HOMESCREEN = 1,
}

export type TreatmentName = 'control' | 'delay_load_homescreen';

export const getConfig = (): ExperimentConfig<DELAY_LOAD_HOMESCREEN_PARAM, TreatmentName> => {
  return {
    ...DELAY_LOAD_HOMESCREEN_EXPERIMENT_PARAM,
    id: TubiExperiments.ottMajorPlatformsDelayLoadHomescreen,
    experimentName: 'webott_major_platforms_delay_load_homescreen_v1',
    defaultValue: DELAY_LOAD_HOMESCREEN_PARAM.CONTROL,
    treatments: [
      { name: 'control', value: DELAY_LOAD_HOMESCREEN_PARAM.CONTROL },
      { name: 'delay_load_homescreen', value: DELAY_LOAD_HOMESCREEN_PARAM.DELAY_LOAD_HOMESCREEN },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
