import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottComcastRegistrationEnableEnterEmail: 'webott_comcast_registration_enable_enter_email';
  }
}

TubiExperiments.ottComcastRegistrationEnableEnterEmail = 'webott_comcast_registration_enable_enter_email';

export const COMCAST_REGISTRATION_ENABLE_ENTER_EMAIL = {
  namespace: 'webott_comcast_registration_enable_enter_email',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...COMCAST_REGISTRATION_ENABLE_ENTER_EMAIL,
    id: TubiExperiments.ottComcastRegistrationEnableEnterEmail,
    experimentName: 'webott_comcast_registration_enable_enter_email',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enter_email', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'COMCAST',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
