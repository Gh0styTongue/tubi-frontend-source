import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerSamsungUseHlsAds: 'webott_player_ott_samsung_hls_ads_v0';
  }
}

TubiExperiments.ottPlayerSamsungUseHlsAds = 'webott_player_ott_samsung_hls_ads_v0';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottPlayerSamsungUseHlsAds,
    namespace: 'webott_player_ott_samsung_hls_ads_v0',
    parameter: 'use_hls_ads',
    experimentName: 'webott_player_ott_samsung_hls_ads_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'use_hls_ads', value: true },
    ],
    enabledSelector: (state: StoreState) => {
      if (__OTTPLATFORM__ !== 'TIZEN') {
        return false;
      }
      // While this experiment will eventually
      // run for all versions of Samsung this
      // is starting with 2017 and 2018 models.
      // I have these models locally to test with
      // and these models required us to use a 30
      // second ad skip when replacing avplay with
      // hls.js Those are reasons for this limitation
      // for the time being.
      const versionsInTreatment: string[] = [
        '3.0', // 2017
        '4.0', // 2018
      ];
      try {
        const userAgent = state.ui.userAgent.ua;
        for (const versionInTreatment of versionsInTreatment) {
          if (userAgent.indexOf(`Tizen ${versionInTreatment}`) !== -1) {
            return true;
          }
        }
        return false;
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
