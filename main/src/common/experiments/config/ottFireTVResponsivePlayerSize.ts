import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVResponsivePlayerSize: 'webott_firetv_responsive_player_size_v1';
  }
}

TubiExperiments.ottFireTVResponsivePlayerSize = 'webott_firetv_responsive_player_size_v1';

export const getConfig = () => {
  return {
    namespace: 'webott_player_firetv_shared',
    parameter: 'enable_responsive_player',
    id: TubiExperiments.ottFireTVResponsivePlayerSize,
    experimentName: 'webott_firetv_responsive_player_size_v1',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'player_size_responsive', value: true } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
