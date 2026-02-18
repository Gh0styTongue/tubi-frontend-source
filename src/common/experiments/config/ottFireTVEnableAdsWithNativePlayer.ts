import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';
import { semverCompareTo } from 'common/utils/version';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVEnableAdsWithNativePlayer: 'webott_firetv_enable_ads_with_native_player_v3';
  }
}

TubiExperiments.ottFireTVEnableAdsWithNativePlayer = 'webott_firetv_enable_ads_with_native_player_v3';

const MIN_FIRETV_APP_VERSION = '9.35.1000';

export const FIRETV_ENABLE_ADS_WITH_NATIVE_PLAYER = {
  namespace: 'webott_firetv_enable_ads_with_native_player',
  parameter: 'enable_native_player_v3',
};

export const getConfig = () => {
  return {
    ...FIRETV_ENABLE_ADS_WITH_NATIVE_PLAYER,
    id: TubiExperiments.ottFireTVEnableAdsWithNativePlayer,
    experimentName: 'webott_firetv_enable_ads_with_native_player_v3',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_native_player_v2', value: true },
    ],
    enabledSelector: (state: StoreState) => {
      return __OTTPLATFORM__ === 'FIRETV_HYB' && semverCompareTo(state.fire?.appVersion?.semver || '', MIN_FIRETV_APP_VERSION) >= 0;
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
