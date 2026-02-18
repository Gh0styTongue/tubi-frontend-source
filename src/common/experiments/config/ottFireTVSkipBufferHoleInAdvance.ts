import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSkipBufferHoleInAdvance: 'webott_firetv_skip_buffer_hole_in_advance_v0';
  }
}

TubiExperiments.ottFireTVSkipBufferHoleInAdvance = 'webott_firetv_skip_buffer_hole_in_advance_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'skip_buffer_hole_in_advance';

export const FIRETV_SKIP_BUFFER_HOLE_IN_ADVANCE = {
  namespace: 'webott_firetv_buffer_hole_optimization',
  parameter: 'skip_buffer_hole_in_advance_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_SKIP_BUFFER_HOLE_IN_ADVANCE,
    id: TubiExperiments.ottFireTVSkipBufferHoleInAdvance,
    experimentName: 'webott_firetv_skip_buffer_hole_in_advance_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'skip_buffer_hole_in_advance', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
