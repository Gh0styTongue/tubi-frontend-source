import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVCustomAbrController: 'webott_firetv_custom_abr_controller_v0';
  }
}

TubiExperiments.ottFireTVCustomAbrController = 'webott_firetv_custom_abr_controller_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'enable_custom_abr_controller';

export const FIRETV_CUSTOM_ABR_CONTROLLER = {
  namespace: 'webott_firetv_custom_abr_controller',
  parameter: 'enable_custom_abr_controller_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_CUSTOM_ABR_CONTROLLER,
    id: TubiExperiments.ottFireTVCustomAbrController,
    experimentName: 'webott_firetv_custom_abr_controller_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_custom_abr_controller', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
