import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSerialLoading: 'webott_firetv_serial_loading_v0';
  }
}

TubiExperiments.ottFireTVSerialLoading = 'webott_firetv_serial_loading_v0';

export type TreatmentValue = 0 | 1 | 2 | 3;

export type TreatmentName = 'control' | 'enable_serial_loading_for_slow_network' | 'enable_serial_loading_for_seek' | 'enable_serial_loading_for_slow_network_and_seek';

export const FIRETV_SERIAL_LOADING = {
  namespace: 'webott_firetv_custom_abr_controller',
  parameter: 'serial_loading_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_SERIAL_LOADING,
    id: TubiExperiments.ottFireTVSerialLoading,
    experimentName: 'webott_firetv_serial_loading_v0',
    defaultValue: 0,
    inYoubora: true,
    treatments: [
      { name: 'control', value: 0 },
      { name: 'enable_serial_loading_for_slow_network', value: 1 },
      { name: 'enable_serial_loading_for_seek', value: 2 },
      { name: 'enable_serial_loading_for_slow_network_and_seek', value: 3 },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
