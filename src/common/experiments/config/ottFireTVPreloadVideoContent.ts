import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVPreloadVideoContent: 'webott_firetv_preload_video_content_v2';
  }
}

TubiExperiments.ottFireTVPreloadVideoContent = 'webott_firetv_preload_video_content_v2';

export const FIRETV_PRELOAD_VIDEO_CONTENT = {
  namespace: 'webott_firetv_preload_video_content_v2',
  parameter: 'enabled',
};

export const getConfig = (): ExperimentConfig<boolean, string> => {
  return {
    ...FIRETV_PRELOAD_VIDEO_CONTENT,
    id: TubiExperiments.ottFireTVPreloadVideoContent,
    experimentName: 'webott_firetv_preload_video_content_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enabled', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
