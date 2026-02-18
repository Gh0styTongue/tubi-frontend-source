import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottVizioHidecontrols: 'webott_vizio_hide_controls_v0';
  }
}

TubiExperiments.ottVizioHidecontrols = 'webott_vizio_hide_controls_v0';

export const getConfig = () => {
  return {
    namespace: 'webott_player_vizio_shared',
    parameter: 'hide_player_controls_on_start',
    id: TubiExperiments.ottVizioHidecontrols,
    experimentName: 'webott_vizio_hide_controls_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'hide_controls', value: true } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'VIZIO',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
