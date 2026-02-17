import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVReturningUserPrompt: 'webott_firetv_returning_user_prompt_phase2_v2';
  }
}

TubiExperiments.ottFireTVReturningUserPrompt = 'webott_firetv_returning_user_prompt_phase2_v2';

export const FIRETV_RETURNING_USER_PROMPT = {
  namespace: 'webott_firetv_returning_user_prompt_phase2_v2',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_RETURNING_USER_PROMPT,
    id: TubiExperiments.ottFireTVReturningUserPrompt,
    experimentName: 'webott_firetv_returning_user_prompt_phase2_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'show_profile', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
