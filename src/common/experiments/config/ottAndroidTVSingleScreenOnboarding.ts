import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottAndroidTVSingleScreenOnboarding: 'webott_androidtv_single_screen_onboarding';
  }
}

TubiExperiments.ottAndroidTVSingleScreenOnboarding = 'webott_androidtv_single_screen_onboarding';

export const ANDROIDTV_SINGLE_SCREEN_ONBOARDING = {
  namespace: 'webott_androidtv_single_screen_onboarding',
  parameter: 'single_screen_onboarding',
};

export const getConfig = () => {
  return {
    ...ANDROIDTV_SINGLE_SCREEN_ONBOARDING,
    id: TubiExperiments.ottAndroidTVSingleScreenOnboarding,
    experimentName: 'webott_androidtv_single_screen_onboarding',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'single_screen_onboarding', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
