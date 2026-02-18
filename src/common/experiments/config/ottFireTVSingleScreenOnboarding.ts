import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSingleScreenOnboarding: 'webott_firetv_single_screen_onboarding_v3';
  }
}

TubiExperiments.ottFireTVSingleScreenOnboarding = 'webott_firetv_single_screen_onboarding_v3';

export enum FIRETV_SINGLE_SCREEN_ONBOARDING_VALUE {
  CONTROL = 'control',
  ONE_SCREEN = 'one_screen',
}

export const FIRETV_SINGLE_SCREEN_ONBOARDING = {
  namespace: 'webott_firetv_single_screen_onboarding_v3',
  parameter: 'variant',
};

export const getConfig = () => {
  return {
    ...FIRETV_SINGLE_SCREEN_ONBOARDING,
    id: TubiExperiments.ottFireTVSingleScreenOnboarding,
    experimentName: 'webott_firetv_single_screen_onboarding_v3',
    defaultValue: FIRETV_SINGLE_SCREEN_ONBOARDING_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: FIRETV_SINGLE_SCREEN_ONBOARDING_VALUE.CONTROL } as const,
      { name: 'one_screen', value: FIRETV_SINGLE_SCREEN_ONBOARDING_VALUE.ONE_SCREEN } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
