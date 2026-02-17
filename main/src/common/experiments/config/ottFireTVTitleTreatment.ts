import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVTitleTreatment: 'webott_firetv_title_treatment_v2';
  }
}

TubiExperiments.ottFireTVTitleTreatment = 'webott_firetv_title_treatment_v2';

export const FIRETV_TITLE_TREATMENT = {
  namespace: 'webott_firetv_title_treatment_v2',
  parameter: 'enable_art_title',
};

export const getConfig = () => {
  return {
    ...FIRETV_TITLE_TREATMENT,
    id: TubiExperiments.ottFireTVTitleTreatment,
    experimentName: 'webott_firetv_title_treatment_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_art_title', value: true },
    ],
    enabledSelector: () => {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
