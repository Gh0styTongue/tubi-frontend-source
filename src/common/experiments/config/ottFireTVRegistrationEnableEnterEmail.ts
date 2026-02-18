import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVRegistrationEnableEnterEmail: 'webott_firetv_registration_enable_enter_email';
  }
}

TubiExperiments.ottFireTVRegistrationEnableEnterEmail = 'webott_firetv_registration_enable_enter_email';

export const FIRETV_REGISTRATION_ENABLE_ENTER_EMAIL = {
  namespace: 'webott_firetv_registration_enable_enter_email',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_REGISTRATION_ENABLE_ENTER_EMAIL,
    id: TubiExperiments.ottFireTVRegistrationEnableEnterEmail,
    experimentName: 'webott_firetv_registration_enable_enter_email',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enter_email', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
