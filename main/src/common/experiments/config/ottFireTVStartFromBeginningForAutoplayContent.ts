import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVStartFromBeginningForAutoplayContent: 'webott_firetv_start_from_beginning_for_autoplay_content_v3';
  }
}

TubiExperiments.ottFireTVStartFromBeginningForAutoplayContent = 'webott_firetv_start_from_beginning_for_autoplay_content_v3';

export const FIRETV_START_FROM_BEGINNING_FOR_AUTOPLAY_CONTENT = {
  namespace: 'webott_firetv_start_from_beginning_for_autoplay_content',
  parameter: 'start_from_beginning',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'start_from_beginning';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_START_FROM_BEGINNING_FOR_AUTOPLAY_CONTENT,
    id: TubiExperiments.ottFireTVStartFromBeginningForAutoplayContent,
    experimentName: 'webott_firetv_start_from_beginning_for_autoplay_content_v3',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'start_from_beginning', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
