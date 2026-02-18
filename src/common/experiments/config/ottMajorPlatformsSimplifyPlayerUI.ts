import type { Store } from 'redux';
import type { ValueOf } from 'ts-essentials';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsSimplifyPlayerUI: 'webott_major_platforms_simplify_player_ui_v0';
  }
}

TubiExperiments.ottMajorPlatformsSimplifyPlayerUI = 'webott_major_platforms_simplify_player_ui_v0';

export const MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE = {
  CONTROL: 0,
  DISABLE_TRANSITION: 1,
  DISABLE_TRANSLATE3D: 2,
} as const;

export type TreatmentValue = ValueOf<typeof MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE>;

export type TreatmentName = 'control' | 'simplify_player_ui_disable_transition' | 'simplify_player_ui_disable_translate3d';

export const MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI = {
  namespace: 'webott_major_platforms_rebuffered_plays_optimization',
  parameter: 'enable_simplify_player_ui_v0',
};

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI,
    id: TubiExperiments.ottMajorPlatformsSimplifyPlayerUI,
    experimentName: 'webott_major_platforms_simplify_player_ui_v0',
    defaultValue: MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE.CONTROL,
    inYoubora: true,
    treatments: [
      { name: 'control', value: MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE.CONTROL },
      { name: 'simplify_player_ui_disable_transition', value: MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE.DISABLE_TRANSITION },
      { name: 'simplify_player_ui_disable_translate3d', value: MAJOR_PLATFORMS_SIMPLIFY_PLAYER_UI_MODE.DISABLE_TRANSLATE3D },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
