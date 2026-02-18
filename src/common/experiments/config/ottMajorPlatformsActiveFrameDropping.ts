import type { Store } from 'redux';

import { FIRETV_ACTIVE_FRAME_DROPPING_DEVICE_MODEL_LIST } from 'common/constants/experiments';
import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsActiveFrameDropping: 'webott_major_platforms_active_frame_dropping_v0';
  }
}

TubiExperiments.ottMajorPlatformsActiveFrameDropping = 'webott_major_platforms_active_frame_dropping_v0';

export type TreatmentValue = -1 | 2 | 3;

export type TreatmentName = 'control' | 'keep_2_frames_and_drop_1_frame' | 'keep_3_frames_and_drop_1_frame';

export const MAJOR_PLATFORMS_ACTIVE_FRAME_DROPPING = {
  namespace: 'webott_major_platforms_rebuffered_plays_optimization',
  parameter: 'drop_frame_interval_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...MAJOR_PLATFORMS_ACTIVE_FRAME_DROPPING,
    id: TubiExperiments.ottMajorPlatformsActiveFrameDropping,
    experimentName: 'webott_major_platforms_active_frame_dropping_v0',
    defaultValue: -1,
    inYoubora: true,
    treatments: [
      { name: 'control', value: -1 },
      { name: 'keep_2_frames_and_drop_1_frame', value: 2 },
      { name: 'keep_3_frames_and_drop_1_frame', value: 3 },
    ],
    enabledSelector: () => { // Will run new experiment on major platforms if get positive result on FireTV
      if (__OTTPLATFORM__ !== 'FIRETV_HYB') {
        return false;
      }
      try {
        for (const enabledDeviceModel of FIRETV_ACTIVE_FRAME_DROPPING_DEVICE_MODEL_LIST) {
          if (window.navigator.userAgent.indexOf(`${enabledDeviceModel} `) !== -1) {
            return true;
          }
        }
      } catch {
        return false;
      }
      return false;
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
