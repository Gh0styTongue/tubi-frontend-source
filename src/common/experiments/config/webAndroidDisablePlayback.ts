import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webAndroidDisablePlayback: 'webott_web_android_disable_playback_v2';
  }
}

TubiExperiments.webAndroidDisablePlayback = 'webott_web_android_disable_playback_v2';

export const WEB_ANDROID_DISABLE_PLAYBACK = {
  namespace: 'webott_web_android_disable_playback_v2',
  parameter: 'disable_web_android_playback',
};

export const getConfig = () => {
  return {
    ...WEB_ANDROID_DISABLE_PLAYBACK,
    id: TubiExperiments.webAndroidDisablePlayback,
    experimentName: 'webott_web_android_disable_playback_v2',
    /**
     * You may notice the default value is different from control value, not like the other experiment configs we adde before
     * This is because product want to apply a different stratage on this experiment
     * We'll `graduate` this experiment to 80% users as soon as we launch it, but keep 20% allocation for comparison
     * Also, we'll keep the control value as `false` to make sure control group behaves the same as current production
     * More detail in https://docs.google.com/document/d/1kaClH5sU9Akdm9T4gNbq7TpBdW6RPifFSisupLAIcYw/edit
     */
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'disable_web_android_playback', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
