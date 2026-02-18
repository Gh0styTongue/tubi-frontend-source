import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottLGTVNavigationWithMouse: 'webott_lgtv_navigation_with_mouse';
  }
}

TubiExperiments.ottLGTVNavigationWithMouse = 'webott_lgtv_navigation_with_mouse';

export const LGTV_NAVIGATION_WITH_MOUSE = {
  namespace: 'webott_lgtv_navigation_with_mouse',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...LGTV_NAVIGATION_WITH_MOUSE,
    id: TubiExperiments.ottLGTVNavigationWithMouse,
    experimentName: 'webott_lgtv_navigation_with_mouse',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'navigate_with_mouse', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'LGTV',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
