import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';
declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottRainmakerRetry: 'webott_rainmaker_retry_v3';
  }
}

TubiExperiments.ottRainmakerRetry = 'webott_rainmaker_retry_v3';

export const AD_REQUEST_MAX_RETRIES = 3;

export const OTT_AD_REQUEST_RETRY_NAMESPACE = {
  namespace: 'ads_ott_shared',
  parameter: 'use_retry',
};

export const getConfig = () => {
  return {
    ...OTT_AD_REQUEST_RETRY_NAMESPACE,
    id: TubiExperiments.ottRainmakerRetry,
    experimentName: 'webott_rainmaker_retry_v3',
    defaultValue: true,
    treatments: [
      { name: 'control', value: false },
      { name: 'retry_enabled', value: true },
    ],
    enabledSelector: () => ['FIRETV_HYB', 'TIZEN', 'COMCAST', 'VIZIO', 'LGTV'].includes(__OTTPLATFORM__),
    inYoubora: true,
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
