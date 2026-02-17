import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungDeprecateHealthCheck: 'webott_samsung_deprecate_oz_health_check';
  }
}

TubiExperiments.ottSamsungDeprecateHealthCheck = 'webott_samsung_deprecate_oz_health_check';

export const getConfig = () => {
  return {
    id: TubiExperiments.ottSamsungDeprecateHealthCheck,
    namespace: 'webott_samsung_deprecate_oz_health_check',
    parameter: 'disable_health_check',
    experimentName: 'webott_samsung_deprecate_oz_health_check',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'disable_health_check', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
