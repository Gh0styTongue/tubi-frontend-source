import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVAuthSessionMigration: 'webott_firetv_auth_session_migration';
  }
}

TubiExperiments.ottFireTVAuthSessionMigration = 'webott_firetv_auth_session_migration';

export const FIRETV_AUTH_SESSION_MIGRATION = {
  namespace: 'webott_firetv_auth_session_migration',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...FIRETV_AUTH_SESSION_MIGRATION,
    id: TubiExperiments.ottFireTVAuthSessionMigration,
    experimentName: 'webott_firetv_auth_session_migration',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable_user_session', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'FIRETV_HYB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
