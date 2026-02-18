import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVPreRequestRainmakerUrlWhenNearlyFinishPreview: 'webott_firetv_pre_request_rainmaker_url_when_nearly_finish_preview_v1';
  }
}

TubiExperiments.ottFireTVPreRequestRainmakerUrlWhenNearlyFinishPreview =
  'webott_firetv_pre_request_rainmaker_url_when_nearly_finish_preview_v1';

export const FIRETV_PRE_REQUEST_RAINMAKER_URL_WHEN_NEARLY_FINISH_PREVIEW = {
  namespace: 'webott_firetv_pre_request_rainmaker_url_shared',
  parameter: 'enable_pre_request_rainmaker_preview_v1',
};

export const getConfig = () => {
  return {
    ...FIRETV_PRE_REQUEST_RAINMAKER_URL_WHEN_NEARLY_FINISH_PREVIEW,
    id: TubiExperiments.ottFireTVPreRequestRainmakerUrlWhenNearlyFinishPreview,
    experimentName: 'webott_firetv_pre_request_rainmaker_url_when_nearly_finish_preview_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_pre_request_rainmaker_preview_v1', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
