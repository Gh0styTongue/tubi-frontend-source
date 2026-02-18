import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottComcastDeeplinkDisableEventListener: 'webott_comcast_deeplink_disable_event_listener';
  }
}

TubiExperiments.ottComcastDeeplinkDisableEventListener = 'webott_comcast_deeplink_disable_event_listener';

export const COMCAST_DEEPLINK_DISABLE_EVENT_LISTENER = {
  namespace: 'webott_comcast_deeplink_disable_event_listener',
  parameter: 'disabled',
};

export const getConfig = () => {
  return {
    ...COMCAST_DEEPLINK_DISABLE_EVENT_LISTENER,
    id: TubiExperiments.ottComcastDeeplinkDisableEventListener,
    experimentName: 'webott_comcast_deeplink_disable_event_listener',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'disable_event_listener', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'COMCAST',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
