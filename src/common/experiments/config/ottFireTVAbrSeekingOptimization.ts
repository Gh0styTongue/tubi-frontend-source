import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVAbrSeekingOptimization: 'webott_firetv_abr_seeking_optimization_v1';
  }
}

TubiExperiments.ottFireTVAbrSeekingOptimization = 'webott_firetv_abr_seeking_optimization_v1';

export type TreatmentValue = 0 | 1 | 2;

export type TreatmentName = 'control' | 'seeking_disable_hlsjs_rule_and_abandon_rule' | 'seeking_disable_hlsjs_rule';

export const FIRETV_ABR_SEEKING_OPTIMIZATION = {
  namespace: 'webott_firetv_custom_abr_controller',
  parameter: 'abr_seeking_optimization_v1',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_ABR_SEEKING_OPTIMIZATION,
    id: TubiExperiments.ottFireTVAbrSeekingOptimization,
    experimentName: 'webott_firetv_abr_seeking_optimization_v1',
    defaultValue: 0,
    inYoubora: true,
    treatments: [
      { name: 'control', value: 0 },
      { name: 'seeking_disable_hlsjs_rule_and_abandon_rule', value: 1 },
      { name: 'seeking_disable_hlsjs_rule', value: 2 },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
