import type { AdPlayerOptions } from '@adrise/player/lib/utils/progressiveMp4AdPlayer';
import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVUseViewableImpressionOnProactiveRetryAds: 'webott_firetv_use_viewable_impression_on_proactive_retry_ads';
  }
}

TubiExperiments.ottFireTVUseViewableImpressionOnProactiveRetryAds = 'webott_firetv_use_viewable_impression_on_proactive_retry_ads';

export const FIRETV_USE_VIEWABLE_IMPRESSION_ON_PROACTIVE_RETRY_ADS = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'impression_requirement',
};

export type TreatmentName = 'control' | AdPlayerOptions['impressionRequirement'];

export const getConfig = (): ExperimentConfig<AdPlayerOptions['impressionRequirement'], TreatmentName> => {
  return {
    ...FIRETV_USE_VIEWABLE_IMPRESSION_ON_PROACTIVE_RETRY_ADS,
    id: TubiExperiments.ottFireTVUseViewableImpressionOnProactiveRetryAds,
    experimentName: 'webott_firetv_use_viewable_impression_on_proactive_retry_ads',
    defaultValue: 'none',
    inYoubora: true,
    treatments: [
      { name: 'control', value: 'none' },
      { name: 'with_buffer', value: 'with_buffer' },
      { name: 'after_loaded_data', value: 'after_loaded_data' },
      { name: 'non_zero', value: 'non_zero' },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
