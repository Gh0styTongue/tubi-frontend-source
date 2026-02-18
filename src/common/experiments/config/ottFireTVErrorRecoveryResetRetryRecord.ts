import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVErrorRecoveryResetRetryRecord: 'webott_firetv_error_recovery_reset_retry_record_v1';
  }
}

TubiExperiments.ottFireTVErrorRecoveryResetRetryRecord = 'webott_firetv_error_recovery_reset_retry_record_v1';

export const FIRETV_ERROR_RECOVERY_RESET_RETRY_RECORD = {
  namespace: 'webott_firetv_error_recovery_reset_retry_record',
  parameter: 'reset_retry_record_v1',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'reset_retry_record';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_ERROR_RECOVERY_RESET_RETRY_RECORD,
    id: TubiExperiments.ottFireTVErrorRecoveryResetRetryRecord,
    experimentName: 'webott_firetv_error_recovery_reset_retry_record_v1',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'reset_retry_record', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
