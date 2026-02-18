import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLivePlayerLowerStartLevelMx: 'webott_live_player_lower_start_level_mx_v3';
  }
}

TubiExperiments.ottLivePlayerLowerStartLevelMx = 'webott_live_player_lower_start_level_mx_v3';

export const LIVE_PLAYER_LOWER_START_LEVEL_MX = {
  namespace: 'webott_live_player_lower_start_level_mx_v3',
  parameter: 'lower_start_level',
};

const SUPPORTED_XVIEW_MODELS = ['Xview', 'Xview+', 'SmartTV', 'Smart TV'];

const isTargetDevice = (state: StoreState): boolean => {
  // Check for Android TV platform
  if (__OTTPLATFORM__ !== 'ANDROIDTV') {
    return false;
  }
  try {

    // Check for specific user agent models
    const userAgent = state.ui.userAgent.ua;
    return SUPPORTED_XVIEW_MODELS.some(model =>
      userAgent.toLowerCase().includes(model.toLowerCase())
    );
  } catch {
    // If userAgent is not available or any other error occurs
    return false;
  }
};

export const getConfig = () => {
  return {
    ...LIVE_PLAYER_LOWER_START_LEVEL_MX,
    id: TubiExperiments.ottLivePlayerLowerStartLevelMx,
    experimentName: 'webott_live_player_lower_start_level_mx_v3',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'lower_start_level', value: true },
    ],
    enabledSelector(state: StoreState) {
      return isTargetDevice(state);
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
