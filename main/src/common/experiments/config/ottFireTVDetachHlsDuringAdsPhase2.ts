import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVDetachHlsDuringAdsPhase2: 'webott_firetv_detach_hls_during_ads_phase2_v4';
  }
}

TubiExperiments.ottFireTVDetachHlsDuringAdsPhase2 = 'webott_firetv_detach_hls_during_ads_phase2_v4';

export enum FIRETV_DETACH_HLS_DURING_ADS_PHASE2_VALUE {
  CONTROL = 0,
  CACHE_DURATION_10S = 10,
  CACHE_DURATION_20S = 20,
}

export const FIRETV_DETACH_HLS_DURING_ADS_PHASE2 = {
  namespace: 'webott_player_firetv_shared',
  parameter: 'cache_duration_v4',
};

export const getConfig = () => {
  return {
    ...FIRETV_DETACH_HLS_DURING_ADS_PHASE2,
    id: TubiExperiments.ottFireTVDetachHlsDuringAdsPhase2,
    experimentName: 'webott_firetv_detach_hls_during_ads_phase2_v4',
    defaultValue: FIRETV_DETACH_HLS_DURING_ADS_PHASE2_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: FIRETV_DETACH_HLS_DURING_ADS_PHASE2_VALUE.CONTROL } as const,
      { name: 'cache_duration_10s', value: FIRETV_DETACH_HLS_DURING_ADS_PHASE2_VALUE.CACHE_DURATION_10S } as const,
      { name: 'cache_duration_20s', value: FIRETV_DETACH_HLS_DURING_ADS_PHASE2_VALUE.CACHE_DURATION_20S } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
