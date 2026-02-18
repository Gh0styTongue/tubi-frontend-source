import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVHouseAnimatePauseAds: 'webott_firetv_house_animate_pause_ads_v1';
  }
}

TubiExperiments.ottFireTVHouseAnimatePauseAds = 'webott_firetv_house_animate_pause_ads_v1';

export const FIRETV_HOUSE_ANIMATE_PAUSE_ADS = {
  namespace: 'webott_firetv_animate_pause_ads',
  parameter: 'enable',
};

export const getConfig = () => {
  return {
    ...FIRETV_HOUSE_ANIMATE_PAUSE_ADS,
    id: TubiExperiments.ottFireTVHouseAnimatePauseAds,
    experimentName: 'webott_firetv_house_animate_pause_ads_v1',
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'houseads', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
