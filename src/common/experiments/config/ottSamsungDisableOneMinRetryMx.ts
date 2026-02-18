import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottSamsungDisableOneMinRetryMx: 'webott_samsung_disable_one_min_retry_mx';
  }
}

TubiExperiments.ottSamsungDisableOneMinRetryMx = 'webott_samsung_disable_one_min_retry_mx';

export const SAMSUNG_DISABLE_ONE_MIN_RETRY_MX = {
  namespace: 'webott_samsung_disable_one_min_retry_mx',
  parameter: 'disable_live_page_refresh',
};

export const getConfig = () => {
  return {
    ...SAMSUNG_DISABLE_ONE_MIN_RETRY_MX,
    id: TubiExperiments.ottSamsungDisableOneMinRetryMx,
    experimentName: 'webott_samsung_disable_one_min_retry_mx',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'disable_live_page_refresh', value: true },
    ],
    enabledSelector: () => __OTTPLATFORM__ === 'TIZEN',
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
