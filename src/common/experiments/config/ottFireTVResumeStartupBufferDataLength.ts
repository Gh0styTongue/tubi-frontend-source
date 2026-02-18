import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVResumeStartupBufferDataLength: 'webott_firetv_resume_startup_buffer_data_length_v0';
  }
}

TubiExperiments.ottFireTVResumeStartupBufferDataLength = 'webott_firetv_resume_startup_buffer_data_length_v0';

export const FIRETV_RESUME_STARTUP_BUFFER_DATA_LENGTH = {
  namespace: 'webott_firetv_resume_startup_buffer_data_length',
  parameter: 'resume_buffer_data_length_v0',
};

export type TreatmentValue = 0 | 5 | 10;

export type TreatmentName = 'control' | '5_seconds' | '10_seconds';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_RESUME_STARTUP_BUFFER_DATA_LENGTH,
    id: TubiExperiments.ottFireTVResumeStartupBufferDataLength,
    experimentName: 'webott_firetv_resume_startup_buffer_data_length_v0',
    defaultValue: 0,
    inYoubora: true,
    treatments: [
      { name: 'control', value: 0 },
      { name: '5_seconds', value: 5 },
      { name: '10_seconds', value: 10 },
    ],
    enabledSelector: (state: StoreState) => {
      if (__OTTPLATFORM__ !== 'FIRETV_HYB') {
        return false;
      }
      try {
        const userAgent = state.ui.userAgent.ua;
        return userAgent.indexOf('AFTMM ') === -1;
      } catch {
        // state userAgent isn't always set and the type
        // at compile time assumes it exists. This catch
        // is being used to avoid multiple optional
        // chaining.
        return false;
      }
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
