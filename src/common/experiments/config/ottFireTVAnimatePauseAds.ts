import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVAnimatePauseAds: 'webott_firetv_animate_pause_ads_v0';
  }
}

TubiExperiments.ottFireTVAnimatePauseAds = 'webott_firetv_animate_pause_ads_v0';

export const getConfig = () => {
  return {
    namespace: 'webott_firetv_animate_pause_ads',
    parameter: 'enable',
    id: TubiExperiments.ottFireTVAnimatePauseAds,
    experimentName: 'webott_firetv_animate_pause_ads_v0',
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
