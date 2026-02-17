import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerSamsungUseHlsAdsNewer: 'webott_player_ott_samsung_hls_ads_v2';
  }
}

TubiExperiments.ottPlayerSamsungUseHlsAdsNewer = 'webott_player_ott_samsung_hls_ads_v2';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottPlayerSamsungUseHlsAdsNewer,
    namespace: 'webott_player_ott_samsung_hls_ads_v0',
    parameter: 'use_hls_ads_newer',
    experimentName: 'webott_player_ott_samsung_hls_ads_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: (state: StoreState) => {
      if (__OTTPLATFORM__ !== 'TIZEN') {
        return false;
      }
      const versionsNotInTreatment: string[] = [
        '2.3', // 2015
        '2.4', // 2016
        '3.0', // 2017
        '4.0', // 2018
      ];
      try {
        const userAgent = state.ui.userAgent.ua;
        for (const versionNotInTreatment of versionsNotInTreatment) {
          if (userAgent.indexOf(`Tizen ${versionNotInTreatment}`) !== -1) {
            return false;
          }
        }
        return true;
      } catch {
        // state userAgent isn't always set and the type
        // at compile time assumes it exists. This catch
        // is being used to avoid multiple optional
        // chaining.
        return false;
      }
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
