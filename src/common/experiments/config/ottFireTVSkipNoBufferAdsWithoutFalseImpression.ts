import type { Store } from 'redux';

import { SkipNoBufferAdsWithoutFalseImpressionVariant } from 'common/constants/experiments';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSkipNoBufferAdsWithoutFalseImpression: 'webott_firetv_skip_no_buffer_ads_without_false_impression';
  }
}

TubiExperiments.ottFireTVSkipNoBufferAdsWithoutFalseImpression = 'webott_firetv_skip_no_buffer_ads_without_false_impression';

export const getConfig = () => {
  return {
    namespace: 'webott_firetv_skip_ad_with_healthscore_v4',
    parameter: 'skip_strategy',
    id: TubiExperiments.ottFireTVSkipNoBufferAdsWithoutFalseImpression,
    experimentName: 'webott_firetv_skip_no_buffer_ads_without_false_impression',
    defaultValue: SkipNoBufferAdsWithoutFalseImpressionVariant.skip,
    inYoubora: true,
    treatments: [
      { name: 'control', value: SkipNoBufferAdsWithoutFalseImpressionVariant.control },
      { name: 'skip', value: SkipNoBufferAdsWithoutFalseImpressionVariant.skip },
      { name: 'skip_without_false_impression', value: SkipNoBufferAdsWithoutFalseImpressionVariant.skip_without_false_impression },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
