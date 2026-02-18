import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPS5SkipBufferHoleInAdvance: 'webott_ps5_skip_buffer_hole_in_advance_v0';
  }
}

TubiExperiments.ottPS5SkipBufferHoleInAdvance = 'webott_ps5_skip_buffer_hole_in_advance_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'skip_buffer_hole_in_advance';

export const PS5_SKIP_BUFFER_HOLE_IN_ADVANCE = {
  namespace: 'webott_ps5_rebuffering_optimization',
  parameter: 'skip_buffer_hole_in_advance_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...PS5_SKIP_BUFFER_HOLE_IN_ADVANCE,
    id: TubiExperiments.ottPS5SkipBufferHoleInAdvance,
    experimentName: 'webott_ps5_skip_buffer_hole_in_advance_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'skip_buffer_hole_in_advance', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'PS5',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
