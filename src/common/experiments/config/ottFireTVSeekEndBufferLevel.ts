import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSeekEndBufferLevel: 'webott_firetv_seek_end_buffer_level_v0';
  }
}

TubiExperiments.ottFireTVSeekEndBufferLevel = 'webott_firetv_seek_end_buffer_level_v0';

export type TreatmentValue = 0 | 5 | 10 | 15;

export type TreatmentName = 'control' | 'seek_end_buffer_level_5_seconds' | 'seek_end_buffer_level_10_seconds' | 'seek_end_buffer_level_15_seconds';

export const FIRETV_SEEK_END_BUFFER_LEVEL = {
  namespace: 'webott_firetv_custom_abr_controller',
  parameter: 'seek_end_buffer_level_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_SEEK_END_BUFFER_LEVEL,
    id: TubiExperiments.ottFireTVSeekEndBufferLevel,
    experimentName: 'webott_firetv_seek_end_buffer_level_v0',
    defaultValue: 0,
    inYoubora: true,
    treatments: [
      { name: 'control', value: 0 },
      { name: 'seek_end_buffer_level_5_seconds', value: 5 },
      { name: 'seek_end_buffer_level_10_seconds', value: 10 },
      { name: 'seek_end_buffer_level_15_seconds', value: 15 },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
