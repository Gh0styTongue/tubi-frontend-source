import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webDirectToPlayer: 'webott_web_direct_to_player';
  }
}

TubiExperiments.webDirectToPlayer = 'webott_web_direct_to_player';

export const WEB_DIRECT_TO_PLAYER = {
  namespace: 'webott_web_direct_to_player',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...WEB_DIRECT_TO_PLAYER,
    id: TubiExperiments.webDirectToPlayer,
    experimentName: 'webott_web_direct_to_player',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'directly_to_player', value: true },
    ],
    enabledSelector: ({ ui: { isMobile } }: StoreState) => __WEBPLATFORM__ === 'WEB' && !isMobile,
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
