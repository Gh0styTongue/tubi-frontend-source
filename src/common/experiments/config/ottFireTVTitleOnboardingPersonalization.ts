import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVOnboardingPersonalization: 'webott_firetv_onboarding_personalization_v7';
  }
}

TubiExperiments.ottFireTVOnboardingPersonalization = 'webott_firetv_onboarding_personalization_v7';

export const FIRETV_ONBOARDING_PERSONALIZATION = {
  namespace: 'webott_firetv_onboarding_personalization_v7',
  parameter: 'show_personalization',
};

export const getConfig = () => {
  return {
    ...FIRETV_ONBOARDING_PERSONALIZATION,
    id: TubiExperiments.ottFireTVOnboardingPersonalization,
    experimentName: 'webott_firetv_onboarding_personalization_v7',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'show_personalization', value: true },
    ],
    enabledSelector() {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
