import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webSimplifyRegistrationOnLikeButton: 'webott_web_simplify_registration_on_like_button';
  }
}

TubiExperiments.webSimplifyRegistrationOnLikeButton = 'webott_web_simplify_registration_on_like_button';

export const WEB_SIMPLIFY_REGISTRATION_ON_LIKE_BUTTON = {
  namespace: 'webott_web_simplify_registration_on_like_button',
  parameter: 'simplified',
};

export const getConfig = () => {
  return {
    ...WEB_SIMPLIFY_REGISTRATION_ON_LIKE_BUTTON,
    id: TubiExperiments.webSimplifyRegistrationOnLikeButton,
    experimentName: 'webott_web_simplify_registration_on_like_button_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'simplified', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
