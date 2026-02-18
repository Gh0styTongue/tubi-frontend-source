import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungSingleScreenOnboarding: 'webott_samsung_single_screen_onboarding';
  }
}

TubiExperiments.ottSamsungSingleScreenOnboarding = 'webott_samsung_single_screen_onboarding';

export const SAMSUNG_SINGLE_SCREEN_ONBOARDING = {
  namespace: 'webott_samsung_single_screen_onboarding',
  parameter: 'single_screen_onboarding',
};

export const getConfig = () => {
  return {
    ...SAMSUNG_SINGLE_SCREEN_ONBOARDING,
    id: TubiExperiments.ottSamsungSingleScreenOnboarding,
    experimentName: 'webott_samsung_single_screen_onboarding',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'single_screen_onboarding', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
