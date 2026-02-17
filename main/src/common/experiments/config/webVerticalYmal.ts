import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webVerticalYmal: 'webott_web_vertical_ymal_v4';
  }
}

TubiExperiments.webVerticalYmal = 'webott_web_vertical_ymal_v4';

export const WEB_VERTICAL_YMAL = {
  namespace: 'webott_web_vertical_ymal_v4',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...WEB_VERTICAL_YMAL,
    id: TubiExperiments.webVerticalYmal,
    experimentName: 'webott_web_vertical_ymal_v4',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'wide_layout', value: true } as const,
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
