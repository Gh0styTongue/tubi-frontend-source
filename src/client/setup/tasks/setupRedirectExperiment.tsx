import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import type { TubiStore } from 'common/types/storeState';

export const setupRedirectExperiment = (store: TubiStore, client: ApiClient): Promise<boolean | void> => {
  // lazy-load the redirect experiment code
  return import(
    /* webpackChunkName: "ott-redirect-experiment" */
    './redirectExperiment'
  )
    .then(({ redirectExperiment }) => redirectExperiment(store, client))
    .catch((error) => logger.error(error, 'Failed to load/run Redirect Experiment'));
};
