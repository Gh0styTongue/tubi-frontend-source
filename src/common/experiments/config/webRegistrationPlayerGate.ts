import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webRegistrationPlayerGate: 'webott_web_registration_player_gate';
  }
}

TubiExperiments.webRegistrationPlayerGate = 'webott_web_registration_player_gate';

export enum WEB_REGISTRATION_PLAYER_GATE_VALUE {
  CONTROL = 'control',
  FORCED = 'forced',
  OPTIONAL = 'optional',
}

export const WEB_REGISTRATION_PLAYER_GATE = {
  namespace: 'webott_web_registration_player_gate',
  parameter: 'flow',
};

export const getConfig = () => {
  return {
    ...WEB_REGISTRATION_PLAYER_GATE,
    id: TubiExperiments.webRegistrationPlayerGate,
    experimentName: 'webott_web_registration_player_gate',
    defaultValue: WEB_REGISTRATION_PLAYER_GATE_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: WEB_REGISTRATION_PLAYER_GATE_VALUE.CONTROL } as const,
      { name: 'forced', value: WEB_REGISTRATION_PLAYER_GATE_VALUE.FORCED } as const,
      { name: 'optional', value: WEB_REGISTRATION_PLAYER_GATE_VALUE.OPTIONAL } as const,
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
