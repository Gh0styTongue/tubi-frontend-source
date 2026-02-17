import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioRegistrationSignInWithVizio: 'webott_vizio_registration_sign_in_with_vizio';
  }
}

TubiExperiments.ottVizioRegistrationSignInWithVizio = 'webott_vizio_registration_sign_in_with_vizio';

export const OTT_VIZIO_REGISTRATION_SIGN_IN_WITH_VIZIO = {
  namespace: 'webott_vizio_registration_sign_in_with_vizio_graduated',
  parameter: 'sign_in_with_vizio',
};

export type TreatmentName = 'control' | 'email_prefill';
export type TreatmentValue = 'enter_email' | 'email_prefill';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...OTT_VIZIO_REGISTRATION_SIGN_IN_WITH_VIZIO,
    id: TubiExperiments.ottVizioRegistrationSignInWithVizio,
    experimentName: 'webott_vizio_registration_sign_in_with_vizio_graduated',
    defaultValue: 'email_prefill',
    treatments: [
      { name: 'control', value: 'email_prefill' },
      { name: 'email_prefill', value: 'email_prefill' },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
