import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVContentStartupStallRecovery: 'webott_lgtv_content_startup_stall_recovery_v0';
  }
}

TubiExperiments.ottLGTVContentStartupStallRecovery = 'webott_lgtv_content_startup_stall_recovery_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'enable_recovery';

export const LGTV_CONTENT_STARTUP_STALL_RECOVERY = {
  namespace: 'webott_lgtv_content_startup_stall_recovery',
  parameter: 'enable_recovery_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...LGTV_CONTENT_STARTUP_STALL_RECOVERY,
    id: TubiExperiments.ottLGTVContentStartupStallRecovery,
    experimentName: 'webott_lgtv_content_startup_stall_recovery_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_recovery', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
