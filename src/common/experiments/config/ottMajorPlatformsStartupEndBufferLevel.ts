import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsStartupEndBufferLevel: 'webott_major_platforms_startup_end_buffer_level_v1';
  }
}

TubiExperiments.ottMajorPlatformsStartupEndBufferLevel = 'webott_major_platforms_startup_end_buffer_level_v1';

export type TreatmentValue = 0 | 5 | 10;

export type TreatmentName = 'control' | 'startup_end_buffer_level_5_seconds' | 'startup_end_buffer_level_10_seconds';

export const MAJOR_PLATFORMS_STARTUP_END_BUFFER_LEVEL = {
  namespace: 'webott_major_platforms_rebuffered_plays_optimization',
  parameter: 'startup_end_buffer_level_v1',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...MAJOR_PLATFORMS_STARTUP_END_BUFFER_LEVEL,
    id: TubiExperiments.ottMajorPlatformsStartupEndBufferLevel,
    experimentName: 'webott_major_platforms_startup_end_buffer_level_v1',
    defaultValue: 0,
    inYoubora: true,
    treatments: [
      { name: 'control', value: 0 },
      { name: 'startup_end_buffer_level_5_seconds', value: 5 },
      { name: 'startup_end_buffer_level_10_seconds', value: 10 },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB', // Will run new experiment on major platforms if get positive result on FireTV
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
