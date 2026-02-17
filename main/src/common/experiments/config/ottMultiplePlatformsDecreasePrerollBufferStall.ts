import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMultiplePlatformsDecreasePrerollBufferStall: 'webott_multiple_platforms_decrease_preroll_buffer_stall';
  }
}

TubiExperiments.ottMultiplePlatformsDecreasePrerollBufferStall =
  'webott_multiple_platforms_decrease_preroll_buffer_stall';

export const MULTIPLE_PLATFORMS_DECREASE_PREROLL_BUFFER_STALL = {
  namespace: 'webott_multiple_platforms_decrease_preroll_buffer_stall',
  parameter: 'enable_rely_on_autoplay_attribute',
};

export const getConfig = () => {
  return {
    ...MULTIPLE_PLATFORMS_DECREASE_PREROLL_BUFFER_STALL,
    id: TubiExperiments.ottMultiplePlatformsDecreasePrerollBufferStall,
    experimentName: 'webott_multiple_platforms_decrease_preroll_buffer_stall',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => ['VIZIO', 'LGTV', 'COMCAST'].includes(__OTTPLATFORM__),
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
