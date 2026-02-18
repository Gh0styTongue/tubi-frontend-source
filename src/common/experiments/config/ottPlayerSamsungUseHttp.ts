import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerSamsungUseHttp: 'webott_player_ott_samsung_use_http_content_v0';
  }
}

TubiExperiments.ottPlayerSamsungUseHttp = 'webott_player_ott_samsung_use_http_content_v0';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottPlayerSamsungUseHttp,
    namespace: 'webott_player_ott_samsung_use_http_content_v0',
    parameter: 'use_http_content',
    experimentName: 'webott_player_ott_samsung_use_http_content_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: (state: StoreState) => {
      if (__OTTPLATFORM__ !== 'TIZEN') {
        return false;
      }
      try {
        return state.ui.userAgent.ua.indexOf('Tizen 2.3') !== -1;
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
