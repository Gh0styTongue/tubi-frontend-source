import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let playerWebTheaterMode: 'webott_player_web_theater_mode_v2';
  }
}

TubiExperiments.playerWebTheaterMode = 'webott_player_web_theater_mode_v2';

export enum PLAYER_WEB_THEATER_MODE_VALUE {
  CONTROL = 0,
  ENABLE_BY_DEFAULT_WITHOUT_ICON = 1,
  ENABLE_BY_DEFAULT_WITH_ICON = 2,
  ENABLE_BY_CLICK = 3,
}

export const PLAYER_WEB_THEATER_MODE = {
  namespace: 'webott_player_web_shared',
  parameter: 'theater_mode',
};

export const getConfig = () => {
  return {
    ...PLAYER_WEB_THEATER_MODE,
    id: TubiExperiments.playerWebTheaterMode,
    experimentName: 'webott_player_web_theater_mode_v2',
    defaultValue: PLAYER_WEB_THEATER_MODE_VALUE.CONTROL,
    treatments: [
      { name: 'control', value: PLAYER_WEB_THEATER_MODE_VALUE.CONTROL } as const,
      {
        name: 'enable_by_default_without_icon',
        value: PLAYER_WEB_THEATER_MODE_VALUE.ENABLE_BY_DEFAULT_WITHOUT_ICON,
      } as const,
      {
        name: 'enable_by_default_with_icon',
        value: PLAYER_WEB_THEATER_MODE_VALUE.ENABLE_BY_DEFAULT_WITH_ICON,
      } as const,
      { name: 'enable_by_click', value: PLAYER_WEB_THEATER_MODE_VALUE.ENABLE_BY_CLICK } as const,
    ],
    enabledSelector: () => {
      return __WEBPLATFORM__ === 'WEB';
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
