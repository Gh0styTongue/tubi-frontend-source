import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungAuthSessionMigration: 'webott_samsung_auth_session_migration';
  }
}

TubiExperiments.ottSamsungAuthSessionMigration = 'webott_samsung_auth_session_migration';

export const SAMSUNG_AUTH_SESSION_MIGRATION = {
  namespace: 'webott_samsung_auth_session_migration',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...SAMSUNG_AUTH_SESSION_MIGRATION,
    id: TubiExperiments.ottSamsungAuthSessionMigration,
    experimentName: 'webott_samsung_auth_session_migration',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_user_session', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
