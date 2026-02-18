import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottAndroidtvRedisUserSession: 'webott_androidtv_redis_user_session_v2';
  }
}

TubiExperiments.ottAndroidtvRedisUserSession = 'webott_androidtv_redis_user_session_v2';

export const ANDROIDTV_REDIS_USER_SESSION = {
  namespace: 'webott_androidtv_redis_user_session_v2',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...ANDROIDTV_REDIS_USER_SESSION,
    id: TubiExperiments.ottAndroidtvRedisUserSession,
    experimentName: 'webott_androidtv_redis_user_session_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'stop_redis', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
