import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioPromptLegalTextChange: 'webott_vizio_prompt_legal_text_change';
  }
}

TubiExperiments.ottVizioPromptLegalTextChange = 'webott_vizio_prompt_legal_text_change';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottVizioPromptLegalTextChange,
    namespace: 'webott_vizio_prompt_legal_text_change',
    parameter: 'has_legal_text',
    experimentName: 'webott_vizio_prompt_legal_text_change',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'has_legal_text', value: true } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
