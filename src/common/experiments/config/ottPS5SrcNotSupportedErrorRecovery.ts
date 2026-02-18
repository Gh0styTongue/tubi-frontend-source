import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPS5SrcNotSupportedErrorRecovery: 'webott_ps5_src_not_supported_error_recovery_v0';
  }
}

TubiExperiments.ottPS5SrcNotSupportedErrorRecovery = 'webott_ps5_src_not_supported_error_recovery_v0';

export const PS5_SRC_NOT_SUPPORTED_ERROR_RECOVERY = {
  namespace: 'webott_ps5_src_not_supported_error_recovery',
  parameter: 'src_not_supported_error_recovery_v0',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'retry';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...PS5_SRC_NOT_SUPPORTED_ERROR_RECOVERY,
    id: TubiExperiments.ottPS5SrcNotSupportedErrorRecovery,
    experimentName: 'webott_ps5_src_not_supported_error_recovery_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'retry', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'PS5',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
