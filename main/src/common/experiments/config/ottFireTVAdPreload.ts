import type { AD_PRELOAD_METHOD } from '@adrise/player';
import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVAdPreload: 'webott_firetv_ad_preload_v3';
  }
}

TubiExperiments.ottFireTVAdPreload = 'webott_firetv_ad_preload_v3';

export const OTT_FIRETV_AD_PRELOAD = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'preload',
};

export const getConfig = (): ExperimentConfig<AD_PRELOAD_METHOD, AD_PRELOAD_METHOD> => {
  return {
    ...OTT_FIRETV_AD_PRELOAD,
    id: TubiExperiments.ottFireTVAdPreload,
    experimentName: 'webott_firetv_ad_preload_v3',
    defaultValue: 'control',
    treatments: [
      { name: 'control', value: 'control' },
      { name: 'preload_per_ad', value: 'preload_per_ad' },
      { name: 'preload_per_ad_pod', value: 'preload_per_ad_pod' },
    ],
    inYoubora: true,
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
