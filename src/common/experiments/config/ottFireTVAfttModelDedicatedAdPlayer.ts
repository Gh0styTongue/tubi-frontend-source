import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVAfttModelDedicatedAdPlayer: 'webott_firetv_aftt_model_dedicated_ad_player_v1';
  }
}

TubiExperiments.ottFireTVAfttModelDedicatedAdPlayer = 'webott_firetv_aftt_model_dedicated_ad_player_v1';

export const FIRETV_AFTT_MODEL_DEDICATED_AD_PLAYER = {
  namespace: 'webott_firetv_aftt_model_dedicated_ad_player',
  parameter: 'dedicated_ad_player_v1',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'dedicated_ad_player';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_AFTT_MODEL_DEDICATED_AD_PLAYER,
    id: TubiExperiments.ottFireTVAfttModelDedicatedAdPlayer,
    experimentName: 'webott_firetv_aftt_model_dedicated_ad_player_v1',
    defaultValue: false,
    inYoubora: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'dedicated_ad_player', value: true },
    ],
    enabledSelector: (state: StoreState) => {
      if (__OTTPLATFORM__ !== 'FIRETV_HYB') {
        return false;
      }
      try {
        const userAgent = state.ui.userAgent.ua;
        return userAgent.indexOf('AFTT ') !== -1;
      } catch {
        // state userAgent isn't always set and the type
        // at compile time assumes it exists. This catch
        // is being used to avoid multiple optional
        // chaining.
        return false;
      }
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
