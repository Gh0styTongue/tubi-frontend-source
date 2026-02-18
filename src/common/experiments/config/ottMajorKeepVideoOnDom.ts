import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorKeepVideoOnDom: 'webott_major_platforms_keep_video_on_dom_v2';
  }
}

TubiExperiments.ottMajorKeepVideoOnDom = 'webott_major_platforms_keep_video_on_dom_v2';

const MAJOR_KEEP_VIDEO_ON_DOM = {
  namespace: 'webott_major_platforms_keep_video_on_dom_v0',
  parameter: 'keep_on_dom',
};

export const getConfig = () => {
  return {
    ...MAJOR_KEEP_VIDEO_ON_DOM,
    id: TubiExperiments.ottMajorKeepVideoOnDom,
    experimentName: 'webott_major_platforms_keep_video_on_dom_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
