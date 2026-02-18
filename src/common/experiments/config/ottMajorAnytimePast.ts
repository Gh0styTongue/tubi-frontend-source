import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorAdsAnytimeLater: 'webott_major_ads_anytime_later_v0';
  }
}

TubiExperiments.ottMajorAdsAnytimeLater = 'webott_major_ads_anytime_later_v0';

export const MAJOR_ADS_ANYTIME_LATER = {
  namespace: 'webott_major_ads_anytime_later_v0',
  parameter: 'ads_anytime_later',
};

export const getConfig = () => {
  return {
    ...MAJOR_ADS_ANYTIME_LATER,
    id: TubiExperiments.ottMajorAdsAnytimeLater,
    experimentName: 'webott_major_ads_anytime_later_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
