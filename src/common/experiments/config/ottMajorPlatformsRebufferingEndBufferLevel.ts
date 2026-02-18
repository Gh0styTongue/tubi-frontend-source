import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsRebufferingEndBufferLevel: 'webott_major_platforms_rebuffering_end_buffer_level_v2';
  }
}

TubiExperiments.ottMajorPlatformsRebufferingEndBufferLevel = 'webott_major_platforms_rebuffering_end_buffer_level_v2';

export type TreatmentValue = 0 | 5 | 10;

export type TreatmentName = 'control' | 'rebuffering_end_buffer_level_5_seconds' | 'rebuffering_end_buffer_level_10_seconds';

export const MAJOR_PLATFORMS_REBUFFERING_END_BUFFER_LEVEL = {
  namespace: 'webott_major_platforms_rebuffered_plays_optimization',
  parameter: 'rebuffering_end_buffer_level_v2',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...MAJOR_PLATFORMS_REBUFFERING_END_BUFFER_LEVEL,
    id: TubiExperiments.ottMajorPlatformsRebufferingEndBufferLevel,
    experimentName: 'webott_major_platforms_rebuffering_end_buffer_level_v2',
    defaultValue: 0,
    inYoubora: true,
    treatments: [
      { name: 'control', value: 0 },
      { name: 'rebuffering_end_buffer_level_5_seconds', value: 5 },
      { name: 'rebuffering_end_buffer_level_10_seconds', value: 10 },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__ && __OTTPLATFORM__ !== 'ANDROIDTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
