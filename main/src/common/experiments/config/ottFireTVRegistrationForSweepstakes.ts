import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVRegistrationForSweepstakes: 'webott_firetv_registration_for_sweepstakes_v2';
  }
}

TubiExperiments.ottFireTVRegistrationForSweepstakes = 'webott_firetv_registration_for_sweepstakes_v2';

export const FIRETV_REGISTRATION_FOR_SWEEPSTAKES = {
  namespace: 'webott_firetv_registration_for_sweepstakes_v2',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_REGISTRATION_FOR_SWEEPSTAKES,
    id: TubiExperiments.ottFireTVRegistrationForSweepstakes,
    experimentName: 'webott_firetv_registration_for_sweepstakes_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'sweepstakes', value: true } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
