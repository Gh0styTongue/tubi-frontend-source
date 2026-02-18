import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVResumeWithLowestLevel: 'webott_firetv_resume_with_lowest_level_v0';
  }
}

TubiExperiments.ottFireTVResumeWithLowestLevel = 'webott_firetv_resume_with_lowest_level_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'resume_with_lowest_level';

export const FIRETV_DETACH_HLS_CACHE_FRAGMENTS = {
  namespace: 'webott_firetv_rebuffered_plays_optimization',
  parameter: 'resume_with_lowest_level_v0',
};

const detachHlsNotEnableModels = [
  'AFTMM', // destroy hls instance, have enabled logic using lowest level when resuming
  'AFTT', // reuse video element, not clean downloaded fragments
];

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_DETACH_HLS_CACHE_FRAGMENTS,
    id: TubiExperiments.ottFireTVResumeWithLowestLevel,
    experimentName: 'webott_firetv_resume_with_lowest_level_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'resume_with_lowest_level', value: true },
    ],
    enabledSelector: (state: StoreState) => {
      try {
        const userAgent = state.ui.userAgent.ua;
        for (const notEnabledModel of detachHlsNotEnableModels) {
          if (userAgent.indexOf(`${notEnabledModel} `) !== -1) {
            return false;
          }
        }
      } catch {
        // state userAgent isn't always set and the type
        // at compile time assumes it exists. This catch
        // is being used to avoid multiple optional
        // chaining.
        return false;
      }
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
