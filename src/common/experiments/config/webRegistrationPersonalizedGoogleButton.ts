import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webRegistrationPersonalizedGoogleButton: 'webott_web_registration_personalized_google_button_v3';
  }
}

TubiExperiments.webRegistrationPersonalizedGoogleButton = 'webott_web_registration_personalized_google_button_v3';

export const WEB_REGISTRATION_PERSONALIZED_GOOGLE_BUTTON = {
  namespace: 'webott_web_registration_personalized_google_button_v3',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...WEB_REGISTRATION_PERSONALIZED_GOOGLE_BUTTON,
    id: TubiExperiments.webRegistrationPersonalizedGoogleButton,
    experimentName: 'webott_web_registration_personalized_google_button_v3',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'personalized_button', value: true } as const,
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
