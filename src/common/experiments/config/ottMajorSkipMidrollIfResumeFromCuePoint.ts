import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorSkipMidrollIfResumeFromCuePoint: 'webott_major_skip_midroll_if_resume_from_cue_point_v0';
  }
}

TubiExperiments.ottMajorSkipMidrollIfResumeFromCuePoint = 'webott_major_skip_midroll_if_resume_from_cue_point_v0';

export const OTT_MAJOR_SKIP_MIDROLL_IF_RESUME_FROM_CUE_POINT = {
  namespace: 'webott_major_skip_midroll_if_resume_from_cue_point_v0',
  parameter: 'skip_midroll',
};

export const getConfig = () => {
  return {
    ...OTT_MAJOR_SKIP_MIDROLL_IF_RESUME_FROM_CUE_POINT,
    id: TubiExperiments.ottMajorSkipMidrollIfResumeFromCuePoint,
    experimentName: 'webott_major_skip_midroll_if_resume_from_cue_point_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'skip_midroll', value: true },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
