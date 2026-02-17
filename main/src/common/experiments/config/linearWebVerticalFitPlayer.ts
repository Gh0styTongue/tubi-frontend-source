import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let linearWebVerticalFitPlayer: 'webott_linear_web_vertical_fit_player_v1';
  }
}

TubiExperiments.linearWebVerticalFitPlayer = 'webott_linear_web_vertical_fit_player_v1';

export const LINEAR_WEB_VERTICAL_FIT_PLAYER = {
  namespace: 'webott_linear_web_shared',
  parameter: 'vertical_fit',
};

export const getConfig = () => {
  return {
    ...LINEAR_WEB_VERTICAL_FIT_PLAYER,
    id: TubiExperiments.linearWebVerticalFitPlayer,
    experimentName: 'webott_linear_web_vertical_fit_player_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'vertical_fit', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
