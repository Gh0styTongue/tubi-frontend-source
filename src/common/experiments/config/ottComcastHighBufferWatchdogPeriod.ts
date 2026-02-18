import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottComcastHighBufferWatchdogPeriod: 'webott_comcast_high_buffer_watchdog_period_v0';
  }
}

export const COMCAST_HIGH_BUFFER_WATCHDOG_PERIOD_VALUE = 8;

TubiExperiments.ottComcastHighBufferWatchdogPeriod = 'webott_comcast_high_buffer_watchdog_period_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'variant';

export const COMCAST_HIGH_BUFFER_WATCHDOG_PERIOD = {
  namespace: 'webott_comcast_rebuffered_plays_optimization',
  parameter: 'high_buffer_watchdog_period_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...COMCAST_HIGH_BUFFER_WATCHDOG_PERIOD,
    id: TubiExperiments.ottComcastHighBufferWatchdogPeriod,
    experimentName: 'webott_comcast_high_buffer_watchdog_period_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'COMCAST',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
