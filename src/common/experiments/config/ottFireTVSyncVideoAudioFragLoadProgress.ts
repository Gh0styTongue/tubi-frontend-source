import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSyncVideoAudioFragLoadProgress: 'webott_firetv_sync_video_audio_frag_load_progress_v1';
  }
}

TubiExperiments.ottFireTVSyncVideoAudioFragLoadProgress = 'webott_firetv_sync_video_audio_frag_load_progress_v1';

export type TreatmentValue = 'Infinity' | '3_frags';

export type TreatmentName = 'control' | 'max_lead_3_frags';

export const TreatmentValue2HlsJsConfigValue = {
  'Infinity': undefined,
  '3_frags': 3,
};

export const FIRETV_SYNC_VIDEO_AUDIO_FRAG_LOAD_PROGRESS = {
  namespace: 'webott_firetv_network_buffering_optimization',
  parameter: 'max_lead_v1',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_SYNC_VIDEO_AUDIO_FRAG_LOAD_PROGRESS,
    id: TubiExperiments.ottFireTVSyncVideoAudioFragLoadProgress,
    experimentName: 'webott_firetv_sync_video_audio_frag_load_progress_v1',
    defaultValue: 'Infinity',
    inYoubora: true,
    treatments: [
      { name: 'control', value: 'Infinity' },
      { name: 'max_lead_3_frags', value: '3_frags' },
    ],
    enabledSelector: () => {
      return __OTTPLATFORM__ === 'FIRETV_HYB';
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
