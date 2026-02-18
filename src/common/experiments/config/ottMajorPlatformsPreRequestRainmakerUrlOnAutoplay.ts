import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVPreRequestRainmakerUrlOnAutoplay: 'webott_major_platforms_pre_request_rainmaker_url_on_autoplay_v0';
  }
}

TubiExperiments.ottFireTVPreRequestRainmakerUrlOnAutoplay = 'webott_major_platforms_pre_request_rainmaker_url_on_autoplay_v0';

export const FIRETV_PRE_REQUEST_RAINMAKER_URL_ON_AUTOPLAY = {
  namespace: 'webott_major_pre_request_rainmaker_url_shared',
  parameter: 'enable_pre_request_rainmaker_autoplay_v0',
};

export const getConfig = () => {
  return {
    ...FIRETV_PRE_REQUEST_RAINMAKER_URL_ON_AUTOPLAY,
    id: TubiExperiments.ottFireTVPreRequestRainmakerUrlOnAutoplay,
    experimentName: 'webott_major_platforms_pre_request_rainmaker_url_on_autoplay_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_pre_request_rainmaker_autoplay_v0', value: true },
    ],
    enabledSelector: () => ['FIRETV_HYB', 'COMCAST', 'LGTV', 'VIZIO', 'TIZEN', 'HILTON'].includes(__OTTPLATFORM__),
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
