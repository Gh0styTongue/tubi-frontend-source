import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottAndroidTVRegistrationOnly: 'webott_androidtv_registration_only';
  }
}

TubiExperiments.ottAndroidTVRegistrationOnly = 'webott_androidtv_registration_only';

export const ANDROIDTV_REGISTRATION_ONLY = {
  namespace: 'webott_androidtv_registration_only',
  parameter: 'registration_only',
};

export const getConfig = () => {
  return {
    ...ANDROIDTV_REGISTRATION_ONLY,
    id: TubiExperiments.ottAndroidTVRegistrationOnly,
    experimentName: 'webott_androidtv_registration_only',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'registration_only', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
