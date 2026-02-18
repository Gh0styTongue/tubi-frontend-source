import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVAdsAnytimeLater: 'webott_firetv_ads_anytime_later_v0';
  }
}

TubiExperiments.ottFireTVAdsAnytimeLater = 'webott_firetv_ads_anytime_later_v0';

export const FIRETV_ADS_ANYTIME_LATER = {
  namespace: 'webott_firetv_ads_anytime_later_v0',
  parameter: 'ads_anytime_later',
};

export const getConfig = () => {
  return {
    ...FIRETV_ADS_ANYTIME_LATER,
    id: TubiExperiments.ottFireTVAdsAnytimeLater,
    experimentName: 'webott_firetv_ads_anytime_later_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
