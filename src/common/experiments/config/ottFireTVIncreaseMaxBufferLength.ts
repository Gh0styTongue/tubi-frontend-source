import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVIncreaseMaxBufferLength: 'webott_firetv_increase_max_buffer_length_v0';
  }
}

TubiExperiments.ottFireTVIncreaseMaxBufferLength = 'webott_firetv_increase_max_buffer_length_v0';

export const FIRETV_INCREASE_MAX_BUFFER_LENGTH_VALUE = {
  maxBufferLength: 30,
  maxMaxBufferLength: 90,
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'increase_max_buffer_length';

export const FIRETV_INCREASE_MAX_BUFFER_LENGTH = {
  namespace: 'webott_firetv_rebuffered_plays_optimization',
  parameter: 'increase_max_buffer_length_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_INCREASE_MAX_BUFFER_LENGTH,
    id: TubiExperiments.ottFireTVIncreaseMaxBufferLength,
    experimentName: 'webott_firetv_increase_max_buffer_length_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'increase_max_buffer_length', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
