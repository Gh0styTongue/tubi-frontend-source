import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsSeekEndBufferLevel: 'webott_major_platforms_seek_end_buffer_level_v0';
  }
}

TubiExperiments.ottMajorPlatformsSeekEndBufferLevel = 'webott_major_platforms_seek_end_buffer_level_v0';

export type TreatmentValue = 0 | 10;

export type TreatmentName = 'control' | 'seek_end_buffer_level_10_seconds';

export const MAJOR_PLATFORMS_SEEK_END_BUFFER_LEVEL = {
  namespace: 'webott_major_platforms_rebuffered_plays_optimization',
  parameter: 'seek_end_buffer_level_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...MAJOR_PLATFORMS_SEEK_END_BUFFER_LEVEL,
    id: TubiExperiments.ottMajorPlatformsSeekEndBufferLevel,
    experimentName: 'webott_major_platforms_seek_end_buffer_level_v0',
    defaultValue: 0,
    inYoubora: true,
    treatments: [
      { name: 'control', value: 0 },
      { name: 'seek_end_buffer_level_10_seconds', value: 10 },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__ && __OTTPLATFORM__ !== 'ANDROIDTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
