import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVDedicatedAdPlayer: 'webott_lgtv_dedicated_ad_player_v0';
  }
}

TubiExperiments.ottLGTVDedicatedAdPlayer = 'webott_lgtv_dedicated_ad_player_v0';

export const LGTV_DEDICATED_AD_PLAYER = {
  namespace: 'webott_lgtv_dedicated_ad_player',
  parameter: 'dedicated_ad_player_v0',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'dedicated_ad_player';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...LGTV_DEDICATED_AD_PLAYER,
    id: TubiExperiments.ottLGTVDedicatedAdPlayer,
    experimentName: 'webott_lgtv_dedicated_ad_player_v0',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'dedicated_ad_player', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
