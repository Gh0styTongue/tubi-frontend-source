import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsUnknownBufferingSeekToNearestKeyFrame: 'webott_major_platforms_unknown_buffering_seek_to_nearest_key_frame_v0';
  }
}

TubiExperiments.ottMajorPlatformsUnknownBufferingSeekToNearestKeyFrame = 'webott_major_platforms_unknown_buffering_seek_to_nearest_key_frame_v0';

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'unknown_buffering_seek_to_nearest_key_frame';

export const MAJOR_PLATFORMS_UNKNOWN_BUFFERING_SEEK_TO_NEAREST_KEY_FRAME = {
  namespace: 'webott_major_platforms_rebuffered_plays_optimization',
  parameter: 'unknown_buffering_seek_to_nearest_key_frame_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...MAJOR_PLATFORMS_UNKNOWN_BUFFERING_SEEK_TO_NEAREST_KEY_FRAME,
    id: TubiExperiments.ottMajorPlatformsUnknownBufferingSeekToNearestKeyFrame,
    experimentName: 'webott_major_platforms_unknown_buffering_seek_to_nearest_key_frame_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'unknown_buffering_seek_to_nearest_key_frame', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
