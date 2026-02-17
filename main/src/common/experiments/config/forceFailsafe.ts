import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let forceFailsafe: 'webott_force_failsafe';
  }
}

TubiExperiments.forceFailsafe = 'webott_force_failsafe';

export const FORCE_FAILSAFE = {
  namespace: 'webott_force_failsafe',
  parameter: 'force_failsafe',
};

export const getConfig = () => {
  return {
    ...FORCE_FAILSAFE,
    id: TubiExperiments.forceFailsafe,
    experimentName: 'webott_force_failsafe',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'force_failsafe', value: true },
    ],
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
