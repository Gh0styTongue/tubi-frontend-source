import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsHttp3Video: 'webott_major_platforms_http3_video_v2';
  }
}
// Launch FireTV first and then other major platforms
const enabledSelector = () => ['FIRETV_HYB'].includes(__OTTPLATFORM__);

TubiExperiments.ottMajorPlatformsHttp3Video = 'webott_major_platforms_http3_video_v2';

export const MAJOR_PLATFORMS_HTTP3_VIDEO = {
  namespace: 'webott_major_platforms_http3_video_v2',
  parameter: 'http3',
};

export const getConfig = () => {
  return {
    ...MAJOR_PLATFORMS_HTTP3_VIDEO,
    id: TubiExperiments.ottMajorPlatformsHttp3Video,
    experimentName: 'webott_major_platforms_http3_video_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'http3', value: true },
    ],
    enabledSelector,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
