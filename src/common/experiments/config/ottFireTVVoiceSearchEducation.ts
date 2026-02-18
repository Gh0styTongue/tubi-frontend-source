import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVVoiceSearchEducation: 'webott_firetv_voice_search_education_v5';
  }
}

TubiExperiments.ottFireTVVoiceSearchEducation = 'webott_firetv_voice_search_education_v5';

export const FIRETV_VOICE_SEARCH_EDUCATION = {
  namespace: 'webott_firetv_voice_search_education_v5',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_VOICE_SEARCH_EDUCATION,
    id: TubiExperiments.ottFireTVVoiceSearchEducation,
    experimentName: 'webott_firetv_voice_search_education_v5',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'show_voice_search_education', value: true },
    ],
    enabledSelector() {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
