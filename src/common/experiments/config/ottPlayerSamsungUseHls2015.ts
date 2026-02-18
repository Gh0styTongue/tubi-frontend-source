import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerSamsungUseHls2015: 'webott_player_ott_samsung_use_hlsjs_2015_v2';
  }
}

TubiExperiments.ottPlayerSamsungUseHls2015 = 'webott_player_ott_samsung_use_hlsjs_2015_v2';

const PLAYER_SAMSUNG_USE_HLS_2015 = {
  namespace: 'webott_player_ott_samsung_use_hlsjs_2015_v0',
  parameter: 'use_hlsjs_2015',
};

export const getConfig = () => {
  return {
    ...PLAYER_SAMSUNG_USE_HLS_2015,
    id: TubiExperiments.ottPlayerSamsungUseHls2015,
    experimentName: 'webott_player_ott_samsung_use_hlsjs_2015_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_hlsjs_2015', value: true },
    ],
    enabledSelector(state: StoreState) {
      if (__OTTPLATFORM__ !== 'TIZEN') {
        return false;
      }
      const includedVersions = [
        '2.3', // 2015 avplay
        '2.4', // 2016 avplay
      ];
      return includedVersions.some((includedVersion) => {
        try {
          return state.ui.userAgent.ua.includes(`Tizen ${includedVersion}`);
        } catch {
          // state userAgent isn't always set and the type
          // at compile time assumes it exists. This catch
          // is being used to avoid multiple optional
          // chaining.
          return false;
        }
      });
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
