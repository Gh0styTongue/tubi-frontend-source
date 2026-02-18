import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerSamsungUseSendBeacon: 'webott_player_ott_samsung_use_send_beacon_v1';
  }
}

TubiExperiments.ottPlayerSamsungUseSendBeacon = 'webott_player_ott_samsung_use_send_beacon_v1';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottPlayerSamsungUseSendBeacon,
    namespace: 'webott_player_ott_samsung_use_send_beacon_v0',
    parameter: 'use_send_beacon',
    experimentName: 'webott_player_ott_samsung_use_send_beacon_v1',
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
