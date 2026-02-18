import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottAndroidtvDeeplinkDisableEventListener: 'webott_androidtv_deeplink_disable_event_listener';
  }
}

TubiExperiments.ottAndroidtvDeeplinkDisableEventListener = 'webott_androidtv_deeplink_disable_event_listener';

export const ANDROIDTV_DEEPLINK_DISABLE_EVENT_LISTENER = {
  namespace: 'webott_androidtv_deeplink_disable_event_listener',
  parameter: 'disabled',
};

export const getConfig = () => {
  return {
    ...ANDROIDTV_DEEPLINK_DISABLE_EVENT_LISTENER,
    id: TubiExperiments.ottAndroidtvDeeplinkDisableEventListener,
    experimentName: 'webott_androidtv_deeplink_disable_event_listener',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'disable_event_listener', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
