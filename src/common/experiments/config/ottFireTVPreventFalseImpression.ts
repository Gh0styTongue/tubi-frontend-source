import type { AdPlayerOptions } from '@adrise/player/lib/utils/progressiveMp4AdPlayer';
import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVPreventFalseImpression: 'webott_firetv_prevent_false_impression';
  }
}

TubiExperiments.ottFireTVPreventFalseImpression = 'webott_firetv_prevent_false_impression';

export const FIRETV_PREVENT_FALSE_IMPRESSION = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'impression_requirement',
};

export type TreatmentName = 'control' | AdPlayerOptions['impressionRequirement'];

export const getConfig = (): ExperimentConfig<AdPlayerOptions['impressionRequirement'], TreatmentName> => {
  return {
    ...FIRETV_PREVENT_FALSE_IMPRESSION,
    id: TubiExperiments.ottFireTVPreventFalseImpression,
    experimentName: 'webott_firetv_prevent_false_impression',
    defaultValue: 'none',
    inYoubora: true,
    treatments: [
      { name: 'control', value: 'none' },
      { name: 'with_buffer', value: 'with_buffer' },
      { name: 'after_loaded_data', value: 'after_loaded_data' },
      { name: 'non_zero', value: 'non_zero' },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
