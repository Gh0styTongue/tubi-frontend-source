import type { Store } from 'redux';

import ExperimentManager, { TubiExperiments } from 'common/experiments/ExperimentManager';
import type StoreState from 'common/types/storeState';

declare module 'common/experiments/ExperimentManager' {
  export namespace TubiExperiments {
    export let ottStagingRedirect: 'Redirect to the staging to help us on debugging';
  }
}

TubiExperiments.ottStagingRedirect = 'Redirect to the staging to help us on debugging';

export const enum OTT_STAGING_REDIRECT_TREATMENT {
  control = 0,
  staging1 = 1,
  staging2 = 2,
  alpha = 10,
  custom = 1337,
}

// https://docs.google.com/spreadsheets/d/1gn-VLDmoWhc8HKJxY445C9yAvEuUkzWM8yqwv38vL-A/edit#gid=0
export const CUSTOM_TREATMENT_GOOGLE_DOC_CSV = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ1w-Da_GSY7SLtDEV6TJ4yGOcivnQ1zxy91oM7WJp4ldFMI3wYlL1gJadyydyiZWO9VwoNvebdRwfT/pub?output=csv';

export const getOTTStagingRedirectExperimentConfig = () => {
  return {
    id: TubiExperiments.ottStagingRedirect,
    namespace: 'webott_staging_redirect',
    experimentName: 'webott_staging_redirect_v2',
    parameter: 'environment',
    defaultValue: 0,
    treatments: [
      { name: 'control', value: OTT_STAGING_REDIRECT_TREATMENT.control },
      { name: 'staging-1', value: OTT_STAGING_REDIRECT_TREATMENT.staging1 },
      { name: 'staging-2', value: OTT_STAGING_REDIRECT_TREATMENT.staging2 },
      { name: 'alpha', value: OTT_STAGING_REDIRECT_TREATMENT.alpha },
      { name: 'custom', value: OTT_STAGING_REDIRECT_TREATMENT.custom },
    ],
    enabledSelector: () => __ISOTT__ === true,
  };
};

export default (store?: Store<StoreState>) =>
  ExperimentManager(store).registerExperiment(getOTTStagingRedirectExperimentConfig());
