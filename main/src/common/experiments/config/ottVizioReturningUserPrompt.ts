import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioReturningUserPrompt: 'webott_vizio_returning_user_prompt';
  }
}

TubiExperiments.ottVizioReturningUserPrompt = 'webott_vizio_returning_user_prompt';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottVizioReturningUserPrompt,
    namespace: 'webott_vizio_returning_user_prompt',
    parameter: 'vizio_prompt',
    experimentName: 'webott_vizio_returning_user_prompt',
    defaultValue: 'disable' as const,
    treatments: [
      { name: 'control', value: 'disable' } as const,
      { name: 'show_prompt', value: 'enable' } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
