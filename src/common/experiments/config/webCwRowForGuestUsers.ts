import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webCwRowForGuestUsers: 'webott_web_cw_row_for_guest_users';
  }
}

TubiExperiments.webCwRowForGuestUsers = 'webott_web_cw_row_for_guest_users';

export const WEB_CW_ROW_FOR_GUEST_USERS = {
  namespace: 'webott_web_cw_row_for_guest_users',
  parameter: 'show',
};

export const getConfig = () => {
  return {
    ...WEB_CW_ROW_FOR_GUEST_USERS,
    id: TubiExperiments.webCwRowForGuestUsers,
    experimentName: 'webott_web_cw_row_for_guest_users',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'cw', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
