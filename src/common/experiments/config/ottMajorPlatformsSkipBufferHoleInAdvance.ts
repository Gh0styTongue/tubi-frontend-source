import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsSkipBufferHoleInAdvance: 'webott_major_platforms_skip_buffer_hole_in_advance_v0';
  }
}

TubiExperiments.ottMajorPlatformsSkipBufferHoleInAdvance = 'webott_major_platforms_skip_buffer_hole_in_advance_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'skip_buffer_hole_in_advance';

export const MAJOR_PLATFORMS_SKIP_BUFFER_HOLE_IN_ADVANCE = {
  namespace: 'webott_major_platforms_rebuffered_plays_optimization',
  parameter: 'skip_buffer_hole_in_advance_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...MAJOR_PLATFORMS_SKIP_BUFFER_HOLE_IN_ADVANCE,
    id: TubiExperiments.ottMajorPlatformsSkipBufferHoleInAdvance,
    experimentName: 'webott_major_platforms_skip_buffer_hole_in_advance_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'skip_buffer_hole_in_advance', value: true },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__ && __OTTPLATFORM__ !== 'ANDROIDTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
