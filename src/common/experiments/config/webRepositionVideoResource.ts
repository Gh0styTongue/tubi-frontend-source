import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webRepositionVideoResource: 'webott_web_reposition_video_resource_v5';
  }
}

TubiExperiments.webRepositionVideoResource = 'webott_web_reposition_video_resource_v5';

export const WEB_REPOSITION_VIDEO_RESOURCE = {
  namespace: 'webott_player_web_shared',
  parameter: 'enable_reposition_v5',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'reposition';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...WEB_REPOSITION_VIDEO_RESOURCE,
    id: TubiExperiments.webRepositionVideoResource,
    experimentName: 'webott_web_reposition_video_resource_v5',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'reposition', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
