import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVHighBufferWatchdogPeriod: 'webott_firetv_high_buffer_watchdog_period_v0';
  }
}

export const FIRETV_HIGH_BUFFER_WATCHDOG_PERIOD_VARIANT_VALUE = 2;

TubiExperiments.ottFireTVHighBufferWatchdogPeriod = 'webott_firetv_high_buffer_watchdog_period_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'buffer_hole_nudge_faster';

export const FIRETV_HIGH_BUFFER_WATCHDOG_PERIOD = {
  namespace: 'webott_firetv_buffer_hole_optimization',
  parameter: 'high_buffer_watchdog_period_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_HIGH_BUFFER_WATCHDOG_PERIOD,
    id: TubiExperiments.ottFireTVHighBufferWatchdogPeriod,
    experimentName: 'webott_firetv_high_buffer_watchdog_period_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'buffer_hole_nudge_faster', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
