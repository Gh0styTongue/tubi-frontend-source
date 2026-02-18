import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungRepositionVideoResource: 'webott_samsung_reposition_video_resource_v0';
  }
}

TubiExperiments.ottSamsungRepositionVideoResource = 'webott_samsung_reposition_video_resource_v0';

export const SAMSUNG_REPOSITION_VIDEO_RESOURCE = {
  namespace: 'webott_player_samsung_shared',
  parameter: 'enable_reposition_v0',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'reposition';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...SAMSUNG_REPOSITION_VIDEO_RESOURCE,
    id: TubiExperiments.ottSamsungRepositionVideoResource,
    experimentName: 'webott_samsung_reposition_video_resource_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'reposition', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
