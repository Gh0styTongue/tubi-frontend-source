import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottMajorRequestAdsAfterSeek: 'webott_major_request_ads_after_seek_v0';
  }
}

TubiExperiments.ottMajorRequestAdsAfterSeek = 'webott_major_request_ads_after_seek_v0';

export const MAJOR_REQUEST_ADS_AFTER_SEEK = {
  namespace: 'webott_major_request_ads_after_seek',
  parameter: 'enable',
};

export const getConfig = () => {
  return {
    ...MAJOR_REQUEST_ADS_AFTER_SEEK,
    id: TubiExperiments.ottMajorRequestAdsAfterSeek,
    experimentName: 'webott_major_request_ads_after_seek_v0',
    defaultValue: false,
    treatments: [
      { name: 'control', value: false },
      { name: 'enable', value: true },
    ],
    enabledSelector: () =>
      ['FIRETV_HYB', 'COMCAST', 'COX', 'HILTON', 'LGTV', 'TIZEN', 'VIZIO', 'SHAW', 'ROGERS'].includes(__OTTPLATFORM__),
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
