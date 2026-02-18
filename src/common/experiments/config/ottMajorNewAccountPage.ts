import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorNewAccountPage: 'webott_major_new_account_page';
  }
}

TubiExperiments.ottMajorNewAccountPage = 'webott_major_new_account_page';

export const MAJOR_NEW_ACCOUNT_PAGE = {
  namespace: 'webott_major_new_account_page',
  parameter: 'enabled',
};

export const getConfig = () => {
  return {
    ...MAJOR_NEW_ACCOUNT_PAGE,
    id: TubiExperiments.ottMajorNewAccountPage,
    experimentName: 'webott_major_new_account_page_v2',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'new', value: true },
    ],
    enabledSelector: () => ['FIRETV_HYB', 'ANDROIDTV', 'LGTV', 'TIZEN', 'COMCAST', 'VIZIO'].includes(__OTTPLATFORM__),
    inYoubora: false,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
