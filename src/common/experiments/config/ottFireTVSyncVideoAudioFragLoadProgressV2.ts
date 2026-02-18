import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSyncVideoAudioFragLoadProgressV2: 'webott_firetv_sync_video_audio_frag_load_progress_v2';
  }
}

TubiExperiments.ottFireTVSyncVideoAudioFragLoadProgressV2 = 'webott_firetv_sync_video_audio_frag_load_progress_v2';

export type TreatmentValue = 1 | 3 | 5;

export type TreatmentName = 'control' | 'max_lead_3_audio_frags' | 'max_lead_5_audio_frags';

export const FIRETV_SYNC_VIDEO_AUDIO_FRAG_LOAD_PROGRESS_V2 = {
  namespace: 'webott_firetv_network_buffering_optimization',
  parameter: 'max_lead_audio_frags_v2',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_SYNC_VIDEO_AUDIO_FRAG_LOAD_PROGRESS_V2,
    id: TubiExperiments.ottFireTVSyncVideoAudioFragLoadProgressV2,
    experimentName: 'webott_firetv_sync_video_audio_frag_load_progress_v2',
    defaultValue: 1,
    inYoubora: true,
    treatments: [
      { name: 'control', value: 1 },
      { name: 'max_lead_3_audio_frags', value: 3 },
      { name: 'max_lead_5_audio_frags', value: 5 },
    ],
    enabledSelector: () => {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
