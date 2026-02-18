import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorPlatformsRemovePlayerSignUpButton: 'webott_major_platforms_remove_player_sign_up_button_v1';
  }
}

TubiExperiments.ottMajorPlatformsRemovePlayerSignUpButton = 'webott_major_platforms_remove_player_sign_up_button_v1';

export const REMOVE_PLAYER_SIGN_UP_BUTTON = {
  namespace: 'webott_player_major_platforms_shared',
  parameter: 'remove_player_sign_up_button',
};

export const getConfig = () => {
  return {
    ...REMOVE_PLAYER_SIGN_UP_BUTTON,
    id: TubiExperiments.ottMajorPlatformsRemovePlayerSignUpButton,
    experimentName: 'webott_major_platforms_remove_player_sign_up_button_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'remove_player_sign_up_button', value: true } as const,
    ],
    enabledSelector: () => __IS_MAJOR_PLATFORM__,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
