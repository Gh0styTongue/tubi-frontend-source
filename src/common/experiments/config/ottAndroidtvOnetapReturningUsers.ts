import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottAndroidtvOnetapReturningUsers: 'webott_androidtv_onetap_returning_users';
  }
}

TubiExperiments.ottAndroidtvOnetapReturningUsers = 'webott_androidtv_onetap_returning_users';

export const ANDROIDTV_ONETAP_RETURNING_USERS = {
  namespace: 'webott_androidtv_onetap_returning_users',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...ANDROIDTV_ONETAP_RETURNING_USERS,
    id: TubiExperiments.ottAndroidtvOnetapReturningUsers,
    experimentName: 'webott_androidtv_onetap_returning_users',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false } as const,
      { name: 'for_returning_users', value: true } as const,
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'ANDROIDTV',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
