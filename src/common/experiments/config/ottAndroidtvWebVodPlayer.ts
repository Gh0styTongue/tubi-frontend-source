import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';
import { semverCompareTo } from 'common/utils/version';

const TargetMinAndroidPackageVersion = '9.27.5';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottAndroidtvWebVodPlayer: 'webott_androidtv_web_vod_player_v1';
  }
}

TubiExperiments.ottAndroidtvWebVodPlayer = 'webott_androidtv_web_vod_player_v1';

export const ANDROIDTV_WEB_VOD_PLAYER = {
  namespace: 'webott_androidtv_web_vod_player_v1',
  parameter: 'enable_web_vod_player',
};

export const getConfig = () => {
  return {
    ...ANDROIDTV_WEB_VOD_PLAYER,
    id: TubiExperiments.ottAndroidtvWebVodPlayer,
    experimentName: 'webott_androidtv_web_vod_player_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_web_vod_player', value: true },
    ],
    enabledSelector: (state: StoreState) => __OTTPLATFORM__ === 'ANDROIDTV' && semverCompareTo(state.fire?.appVersion?.semver || '', TargetMinAndroidPackageVersion) >= 0,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
