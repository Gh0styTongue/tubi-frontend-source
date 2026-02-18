import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPlayerHisenseUseSendBeacon: 'webott_player_ott_hisense_use_send_beacon_v0';
  }
}

TubiExperiments.ottPlayerHisenseUseSendBeacon = 'webott_player_ott_hisense_use_send_beacon_v0';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottPlayerHisenseUseSendBeacon,
    namespace: 'webott_player_ott_hisense_use_send_beacon_v0',
    parameter: 'use_send_beacon',
    experimentName: 'webott_player_ott_hisense_use_send_beacon_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'HISENSE',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
