import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webRegistrationMagicLinkV3: 'webott_web_registration_magic_link_v4';
  }
}

TubiExperiments.webRegistrationMagicLinkV3 = 'webott_web_registration_magic_link_v4';

export const WEB_REGISTRATION_MAGIC_LINK_V3 = {
  namespace: 'webott_web_registration_magic_link_v4',
  parameter: 'magic_link_option',
};

export type TreatmentName = 'control' | 'password_first' | 'magic_link_first';
export type TreatmentValue = 'on_invalid_password' | 'password_first' | 'magic_link_first';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...WEB_REGISTRATION_MAGIC_LINK_V3,
    id: TubiExperiments.webRegistrationMagicLinkV3,
    experimentName: 'webott_web_registration_magic_link_v4',
    defaultValue: 'on_invalid_password',
    treatments: [
      { name: 'control', value: 'on_invalid_password' },
      { name: 'password_first', value: 'password_first' },
      { name: 'magic_link_first', value: 'magic_link_first' },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
