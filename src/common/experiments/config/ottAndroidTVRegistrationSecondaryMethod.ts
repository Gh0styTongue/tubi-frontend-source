import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottAndroidTVRegistrationSecondaryMethod: 'webott_androidtv_registration_secondary_method';
  }
}

TubiExperiments.ottAndroidTVRegistrationSecondaryMethod = 'webott_androidtv_registration_secondary_method';

export const getConfig = () => {
  return {
    namespace: 'webott_androidtv_registration_secondary_method',
    parameter: 'secondary_method',
    id: TubiExperiments.ottAndroidTVRegistrationSecondaryMethod,
    experimentName: 'webott_androidtv_registration_secondary_method_v2',
    defaultValue: 'activation' as const,
    treatments: [
      { name: 'control', value: 'activation' } as const,
      { name: 'enter_email', value: 'enter_email' } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
