import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webVideoPreview: 'web video preview experiment';
  }
}

export const WEB_VIDEO_PREVIEW = {
  namespace: 'webott_web_video_preview_v5',
  parameter: 'type',
};

export const getWebVideoPreviewConfig = () => {
  TubiExperiments.webVideoPreview = 'web video preview experiment';
  return {
    ...WEB_VIDEO_PREVIEW,
    id: TubiExperiments.webVideoPreview,
    experimentName: 'webott_web_video_preview_v5',
    defaultValue: 'control',
    treatments: [
      { name: 'control', value: 'control' },
      { name: 'tile_preview', value: 'tile_preview' },
      { name: 'combined', value: 'combined' },
    ],
    enabledSelector: (state: StoreState) => {
      const { ui: { isMobile } } = state;
      return __WEBPLATFORM__ === 'WEB' && !isMobile;
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getWebVideoPreviewConfig());
