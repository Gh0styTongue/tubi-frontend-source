import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPrefetchThumbnails: 'webott_major_platforms_prefetch_thumbnails_in_playback_v0';
  }
}

TubiExperiments.ottMajorPrefetchThumbnails = 'webott_major_platforms_prefetch_thumbnails_in_playback_v0';

export const PREFETCH_THUMBNAILS = {
  namespace: 'webott_player_major_platforms_thumbnails',
  parameter: 'prefetch_during_playback',
};

export const getConfig = () => {
  return {
    ...PREFETCH_THUMBNAILS,
    id: TubiExperiments.ottMajorPrefetchThumbnails,
    experimentName: 'webott_major_platforms_prefetch_thumbnails_in_playback_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'enable_prefetch', value: true } as const,
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
