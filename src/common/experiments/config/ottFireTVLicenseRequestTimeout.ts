import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottFireTVLicenseRequestTimeout: 'webott_firetv_license_request_timeout_v0';
  }
}

TubiExperiments.ottFireTVLicenseRequestTimeout = 'webott_firetv_license_request_timeout_v0';

export const FIRETV_LICENSE_REQUEST_TIMEOUT = {
  namespace: 'webott_firetv_license_request_timeout_v0',
  parameter: 'timeout_license_request',
};

export const getConfig = () => {
  return {
    ...FIRETV_LICENSE_REQUEST_TIMEOUT,
    id: TubiExperiments.ottFireTVLicenseRequestTimeout,
    experimentName: 'webott_firetv_license_request_timeout_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'variant', value: true },
    ],
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
