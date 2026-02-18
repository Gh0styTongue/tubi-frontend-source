import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVPreRequestRainmakerUrlOnAutoplay: 'webott_firetv_pre_request_rainmaker_url_on_autoplay_v1';
  }
}

TubiExperiments.ottFireTVPreRequestRainmakerUrlOnAutoplay = 'webott_firetv_pre_request_rainmaker_url_on_autoplay_v1';

export const FIRETV_PRE_REQUEST_RAINMAKER_URL_ON_AUTOPLAY = {
  namespace: 'webott_firetv_pre_request_rainmaker_url_shared',
  parameter: 'enable_pre_request_rainmaker_v1',
};

export const getConfig = () => {
  return {
    ...FIRETV_PRE_REQUEST_RAINMAKER_URL_ON_AUTOPLAY,
    id: TubiExperiments.ottFireTVPreRequestRainmakerUrlOnAutoplay,
    experimentName: 'webott_firetv_pre_request_rainmaker_url_on_autoplay_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_pre_request_rainmaker', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
