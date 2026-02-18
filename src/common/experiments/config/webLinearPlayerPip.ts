import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webLinearPlayerPip: 'webott_web_linear_player_pip_v1';
  }
}

TubiExperiments.webLinearPlayerPip = 'webott_web_linear_player_pip_v1';

export const WEB_LINEAR_PLAYER_PIP = {
  namespace: 'webott_web_player_pip',
  parameter: 'linear_pip_enabled',
};

export const getConfig = () => {
  return {
    ...WEB_LINEAR_PLAYER_PIP,
    id: TubiExperiments.webLinearPlayerPip,
    experimentName: 'webott_web_linear_player_pip_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'pip_enabled', value: true },
    ],
    enabledSelector: (state: StoreState) => {
      const { ui: { isMobile } } = state;
      return __WEBPLATFORM__ === 'WEB' && !isMobile;
    },
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
