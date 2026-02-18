import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottXboxoneAuthSessionMigration: 'webott_xboxone_auth_session_migration';
  }
}

TubiExperiments.ottXboxoneAuthSessionMigration = 'webott_xboxone_auth_session_migration';

export const XBOXONE_AUTH_SESSION_MIGRATION = {
  namespace: 'webott_xboxone_auth_session_migration',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...XBOXONE_AUTH_SESSION_MIGRATION,
    id: TubiExperiments.ottXboxoneAuthSessionMigration,
    experimentName: 'webott_xboxone_auth_session_migration',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_user_session', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'XBOXONE',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
