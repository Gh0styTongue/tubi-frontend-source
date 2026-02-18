import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webCompactSignupForm: 'webott_web_compact_signup_form';
  }
}

TubiExperiments.webCompactSignupForm = 'webott_web_compact_signup_form';

export const WEB_COMPACT_SIGNUP_FORM = {
  namespace: 'webott_web_compact_signup_form',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...WEB_COMPACT_SIGNUP_FORM,
    id: TubiExperiments.webCompactSignupForm,
    experimentName: 'webott_web_compact_signup_form',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'compact', value: true } as const,
    ],
    enabledSelector: (state: StoreState) => __WEBPLATFORM__ === 'WEB' && !isGDPREnabledSelector(state),
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
