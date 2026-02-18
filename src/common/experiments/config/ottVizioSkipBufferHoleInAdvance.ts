import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioSkipBufferHoleInAdvance: 'webott_vizio_skip_buffer_hole_in_advance_v0';
  }
}

TubiExperiments.ottVizioSkipBufferHoleInAdvance = 'webott_vizio_skip_buffer_hole_in_advance_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'skip_buffer_hole_in_advance';

export const VIZIO_SKIP_BUFFER_HOLE_IN_ADVANCE = {
  namespace: 'webott_vizio_rebuffering_optimization',
  parameter: 'skip_buffer_hole_in_advance_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...VIZIO_SKIP_BUFFER_HOLE_IN_ADVANCE,
    id: TubiExperiments.ottVizioSkipBufferHoleInAdvance,
    experimentName: 'webott_vizio_skip_buffer_hole_in_advance_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'skip_buffer_hole_in_advance', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
