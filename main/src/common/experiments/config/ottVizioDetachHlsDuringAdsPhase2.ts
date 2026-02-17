import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';
import { getYouboraEnabled } from 'common/utils/youbora';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioDetachHlsDuringAdsPhase2: 'webott_vizio_detach_hls_during_ads_phase2_v8';
  }
}

TubiExperiments.ottVizioDetachHlsDuringAdsPhase2 = 'webott_vizio_detach_hls_during_ads_phase2_v8';

// VIZIO OS MTKD/MTKC-x.x.x owns more than 2G Memory. MTKB/MTKE own 1G Memory. MTKA owns 0.5G Memory.
const VIZIO_OS_WHITE_REG = /MTK[D|C]/i;

const isTargetPerformanceDevices = (ua?: string) => {
  if (typeof navigator === 'object') {
    return VIZIO_OS_WHITE_REG.test(navigator.userAgent);
  }
  if (ua) {
    return VIZIO_OS_WHITE_REG.test(ua);
  }
  return false;
};

const isEnabled = (state: StoreState) => __OTTPLATFORM__ === 'VIZIO' && isTargetPerformanceDevices(state.ui.userAgent.ua);
const isYouboraEnabled = getYouboraEnabled(isEnabled);
export const VIZIO_DETACH_HLS_DURING_ADS_PHASE2 = {
  namespace: 'webott_player_vizio_shared',
  parameter: 'enable_revert_segments_cache_v8',
};

export const getConfig = (): ExperimentConfig<boolean, 'control' | 'variant'> => {
  return {
    ...VIZIO_DETACH_HLS_DURING_ADS_PHASE2,
    id: TubiExperiments.ottVizioDetachHlsDuringAdsPhase2,
    experimentName: 'webott_vizio_detach_hls_during_ads_phase2_v8',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: isEnabled,
    inYoubora: isYouboraEnabled,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
