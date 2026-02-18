import type { Store } from 'redux';
import type { ValueOf } from 'ts-essentials';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVSimplifyPlayerUI: 'webott_firetv_simplify_player_ui_v1';
  }
}

TubiExperiments.ottFireTVSimplifyPlayerUI = 'webott_firetv_simplify_player_ui_v1';

const FIRETV_SIMPLIFY_PLAYER_UI_DEVICE_MODEL_WHITELIST = [
  'AFTSSS',
  'AFTSS',
  'AFTKM',
  'AFTDCT31',
  'AFTALMO',
  'AFTT',
  'AFTEAMR311',
];

export const FIRETV_SIMPLIFY_PLAYER_UI_MODE = {
  CONTROL: 0,
  DISABLE_TRANSITION: 1,
  DISABLE_WILL_CHANGE: 2,
  DISABLE_TRANSITION_AND_WILL_CHANGE: 3,
} as const;

export type TreatmentValue = ValueOf<typeof FIRETV_SIMPLIFY_PLAYER_UI_MODE>;

export type TreatmentName = 'control' | 'simplify_player_ui_disable_transition' | 'simplify_player_ui_disable_will_change' | 'simplify_player_ui_disable_transition_and_will_change';

export const FIRETV_SIMPLIFY_PLAYER_UI = {
  namespace: 'webott_firetv_custom_abr_controller',
  parameter: 'enable_simplify_player_ui_v1',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...FIRETV_SIMPLIFY_PLAYER_UI,
    id: TubiExperiments.ottFireTVSimplifyPlayerUI,
    experimentName: 'webott_firetv_simplify_player_ui_v1',
    defaultValue: FIRETV_SIMPLIFY_PLAYER_UI_MODE.CONTROL,
    inYoubora: true,
    treatments: [
      { name: 'control', value: FIRETV_SIMPLIFY_PLAYER_UI_MODE.CONTROL },
      { name: 'simplify_player_ui_disable_transition', value: FIRETV_SIMPLIFY_PLAYER_UI_MODE.DISABLE_TRANSITION },
      { name: 'simplify_player_ui_disable_will_change', value: FIRETV_SIMPLIFY_PLAYER_UI_MODE.DISABLE_WILL_CHANGE },
      { name: 'simplify_player_ui_disable_transition_and_will_change', value: FIRETV_SIMPLIFY_PLAYER_UI_MODE.DISABLE_TRANSITION_AND_WILL_CHANGE },
    ],
    enabledSelector: () => {
      if (__OTTPLATFORM__ !== 'FIRETV_HYB') {
        return false;
      }
      try {
        for (const enabledDeviceModel of FIRETV_SIMPLIFY_PLAYER_UI_DEVICE_MODEL_WHITELIST) {
          if (window.navigator.userAgent.indexOf(`${enabledDeviceModel} `) !== -1) {
            return true;
          }
        }
      } catch {
        return false;
      }
      return false;
    },
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
