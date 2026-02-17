import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import { AD_MESSAGE_STYLE } from 'common/features/playback/components/AdMessage/AdMessage';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerFireTVSimpleAdProgress: 'webott_player_firetv_simple_ad_progress_v2';
  }
}

TubiExperiments.ottPlayerFireTVSimpleAdProgress = 'webott_player_firetv_simple_ad_progress_v2';

export const PLAYER_FIRETV_SIMPLE_AD_PROGRESS = {
  namespace: 'ads_configuration_webott_firetv_shared',
  parameter: 'ad_progress_style_v2',
};

export const getConfig = () => {
  return {
    ...PLAYER_FIRETV_SIMPLE_AD_PROGRESS,
    id: TubiExperiments.ottPlayerFireTVSimpleAdProgress,
    experimentName: 'webott_player_firetv_simple_ad_progress_v2',
    defaultValue: AD_MESSAGE_STYLE.LEGACY,
    treatments: [
      { name: 'control', value: AD_MESSAGE_STYLE.LEGACY } as const,
      { name: 'ad_progress_of_all_ads', value: AD_MESSAGE_STYLE.AD_PROGRESS_OF_ALL_ADS } as const,
      {
        name: 'ad_progress_of_current_ad',
        value: AD_MESSAGE_STYLE.AD_PROGRESS_OF_CURRENT_AD,
      } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
