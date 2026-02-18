import type { Store } from 'redux';

import type { ExperimentConfig } from 'common/experiments/ExperimentManager';
import ExperimentManager from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let webAnalyticsAnonymousToken: 'webott_web_analytics_anonymous_token';
  }
}

export const WEB_ANALYTICS_ANONYMOUS_TOKEN = {
  namespace: 'webott_web_analytics_anonymous_token',
  parameter: 'enabled',
};

export type TreatmentValue = false | true;

export type TreatmentName = 'control' | 'enabled';

export const getConfig = (): ExperimentConfig<TreatmentValue, TreatmentName> => {
  return {
    ...WEB_ANALYTICS_ANONYMOUS_TOKEN,
    id: 'webott_web_analytics_anonymous_token',
    experimentName: 'webott_web_analytics_anonymous_token',
    defaultValue: __WEBPLATFORM__ === 'WEB',
    treatments: [
      { name: 'control', value: true },
      { name: 'enabled', value: true },
    ],
    enabledSelector: () => __WEBPLATFORM__ === 'WEB',
  };
};

export default (store?: Store<StoreState>) => ExperimentManager(store).registerExperiment(getConfig());
