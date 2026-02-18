import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVRemoveOnboarding: 'webott_firetv_remove_onboarding';
  }
}

TubiExperiments.ottFireTVRemoveOnboarding = 'webott_firetv_remove_onboarding';

export const FIRETV_REMOVE_ONBOARDING = {
  namespace: 'webott_firetv_remove_onboarding',
  parameter: 'remove_onboarding',
};

export const getConfig = () => {
  return {
    ...FIRETV_REMOVE_ONBOARDING,
    id: TubiExperiments.ottFireTVRemoveOnboarding,
    experimentName: 'webott_firetv_remove_onboarding',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'remove_onboarding', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
