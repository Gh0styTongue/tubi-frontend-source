import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVErrorModalRedesign: 'webott_firetv_error_modal_redesign_v2';
  }
}

TubiExperiments.ottFireTVErrorModalRedesign = 'webott_firetv_error_modal_redesign_v2';

export const enum FIRETV_ERROR_MODAL_REDESIGN_VALUE {
  CONTROL = 'default',
  PREFER_POPULAR_CONTENT = 'prefer_popular_content',
  PREFER_RETRYING = 'prefer_retrying',
}

export const FIRETV_ERROR_MODAL_REDESIGN = {
  namespace: 'webott_firetv_error_modal_redesign_v2',
  parameter: 'error_modal_action',
};

export const getConfig = () => {
  return {
    ...FIRETV_ERROR_MODAL_REDESIGN,
    id: TubiExperiments.ottFireTVErrorModalRedesign,
    experimentName: 'webott_firetv_error_modal_redesign_v2',
    defaultValue: FIRETV_ERROR_MODAL_REDESIGN_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: FIRETV_ERROR_MODAL_REDESIGN_VALUE.CONTROL } as const,
      { name: 'prefer_popular_content', value: FIRETV_ERROR_MODAL_REDESIGN_VALUE.PREFER_POPULAR_CONTENT } as const,
      { name: 'prefer_retrying', value: FIRETV_ERROR_MODAL_REDESIGN_VALUE.PREFER_RETRYING } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
