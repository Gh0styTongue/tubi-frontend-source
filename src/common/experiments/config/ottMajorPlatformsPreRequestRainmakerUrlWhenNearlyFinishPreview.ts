import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsPreRequestRainmakerUrlWhenNearlyFinishPreview: 'webott_major_platforms_pre_request_rainmaker_url_when_nearly_finish_preview_v3';
  }
}

TubiExperiments.ottMajorPlatformsPreRequestRainmakerUrlWhenNearlyFinishPreview =
  'webott_major_platforms_pre_request_rainmaker_url_when_nearly_finish_preview_v3';

export const MAJOR_PLATFORMS_PRE_REQUEST_RAINMAKER_URL_WHEN_NEARLY_FINISH_PREVIEW = {
  namespace: 'webott_major_pre_request_rainmaker_url_shared',
  parameter: 'enable_pre_request_rainmaker_v3',
};

export const getConfig = () => {
  return {
    ...MAJOR_PLATFORMS_PRE_REQUEST_RAINMAKER_URL_WHEN_NEARLY_FINISH_PREVIEW,
    id: TubiExperiments.ottMajorPlatformsPreRequestRainmakerUrlWhenNearlyFinishPreview,
    experimentName: 'webott_major_platforms_pre_request_rainmaker_url_when_nearly_finish_preview_v3',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_pre_request_rainmaker_v3', value: true },
    ],
    enabledSelector: () => ['FIRETV_HYB', 'COMCAST', 'LGTV', 'VIZIO', 'TIZEN', 'HILTON'].includes(__OTTPLATFORM__),
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
