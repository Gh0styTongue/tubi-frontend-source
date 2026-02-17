import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottAndroidtvIntroVideoFps: 'webott_androidtv_intro_video_fps';
  }
}

TubiExperiments.ottAndroidtvIntroVideoFps = 'webott_androidtv_intro_video_fps';

export const ANDROIDTV_INTRO_VIDEO_FPS = {
  namespace: 'webott_androidtv_intro_video_fps',
  parameter: 'use_lower_fps_intro',
};

export const getConfig = () => {
  return {
    ...ANDROIDTV_INTRO_VIDEO_FPS,
    id: TubiExperiments.ottAndroidtvIntroVideoFps,
    experimentName: 'webott_androidtv_intro_video_fps',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
