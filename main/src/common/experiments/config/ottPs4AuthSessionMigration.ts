import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottPs4AuthSessionMigration: 'webott_ps4_auth_session_migration';
  }
}

TubiExperiments.ottPs4AuthSessionMigration = 'webott_ps4_auth_session_migration';

export const PS4_AUTH_SESSION_MIGRATION = {
  namespace: 'webott_ps4_auth_session_migration',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...PS4_AUTH_SESSION_MIGRATION,
    id: TubiExperiments.ottPs4AuthSessionMigration,
    experimentName: 'webott_ps4_auth_session_migration',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_user_session', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'PS4',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
