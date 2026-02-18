import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLgtvSkipBufferHoleInAdvance: 'webott_lgtv_skip_buffer_hole_in_advance_v0';
  }
}

TubiExperiments.ottLgtvSkipBufferHoleInAdvance = 'webott_lgtv_skip_buffer_hole_in_advance_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'skip_buffer_hole_in_advance';

export const LGTV_SKIP_BUFFER_HOLE_IN_ADVANCE = {
  namespace: 'webott_lgtv_rebuffering_optimization',
  parameter: 'skip_buffer_hole_in_advance_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...LGTV_SKIP_BUFFER_HOLE_IN_ADVANCE,
    id: TubiExperiments.ottLgtvSkipBufferHoleInAdvance,
    experimentName: 'webott_lgtv_skip_buffer_hole_in_advance_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'skip_buffer_hole_in_advance', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
