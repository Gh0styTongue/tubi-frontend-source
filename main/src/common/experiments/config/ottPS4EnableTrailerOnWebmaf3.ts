import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPS4EnableTrailerOnWebmaf3: 'webott_ps4_enable_trailer_on_ps4_webmaf3';
  }
}

TubiExperiments.ottPS4EnableTrailerOnWebmaf3 = 'webott_ps4_enable_trailer_on_ps4_webmaf3';

export const PS4_ENABLE_TRAILER_ON_PS4_WEBMAF3 = {
  namespace: 'webott_ps4_enable_trailer_on_ps4_webmaf3',
  parameter: 'enable_trailer',
};

export const getConfig = () => {
  return {
    ...PS4_ENABLE_TRAILER_ON_PS4_WEBMAF3,
    id: TubiExperiments.ottPS4EnableTrailerOnWebmaf3,
    experimentName: 'webott_ps4_enable_trailer_on_ps4_webmaf3',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_trailer', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'PS4',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
