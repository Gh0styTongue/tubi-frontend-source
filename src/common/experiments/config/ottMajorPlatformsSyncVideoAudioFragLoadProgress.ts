import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsSyncVideoAudioFragLoadProgress: 'webott_major_platforms_sync_video_audio_frag_load_progress_v0';
  }
}

TubiExperiments.ottMajorPlatformsSyncVideoAudioFragLoadProgress = 'webott_major_platforms_sync_video_audio_frag_load_progress_v0';

export type TreatmentValue = 'Infinity' | '3_frags';

export type TreatmentName = 'control' | 'max_lead_3_frags';

export const TreatmentValue2HlsJsConfigValue = {
  'Infinity': undefined,
  '3_frags': 3,
};

export const MAJOR_PLATFORMS_SYNC_VIDEO_AUDIO_FRAG_LOAD_PROGRESS = {
  namespace: 'webott_major_platforms_rebuffered_plays_optimization',
  parameter: 'max_lead_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...MAJOR_PLATFORMS_SYNC_VIDEO_AUDIO_FRAG_LOAD_PROGRESS,
    id: TubiExperiments.ottMajorPlatformsSyncVideoAudioFragLoadProgress,
    experimentName: 'webott_major_platforms_sync_video_audio_frag_load_progress_v0',
    defaultValue: 'Infinity',
    inYoubora: true,
    treatments: [
      { name: 'control', value: 'Infinity' },
      { name: 'max_lead_3_frags', value: '3_frags' },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__ && __OTTPLATFORM__ !== 'ANDROIDTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
