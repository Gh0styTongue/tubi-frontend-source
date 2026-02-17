import { exposeToTubiGlobal } from 'client/global';
import { SHOULD_FETCH_DATA_ON_SERVER as DID_FETCH_DATA_ON_SERVER } from 'common/constants/constants';
import registerExperiments from 'common/experiments/config';
import ExperimentManager, {
  configure as configureExperimentManager,
} from 'common/experiments/ExperimentManager';
import type ApiClient from 'common/helpers/ApiClient';
import type { TubiStore } from 'common/types/storeState';

export const setupExperimentManager = async (store: TubiStore, client: ApiClient, useMocks = false) => {
  configureExperimentManager(store, client, useMocks);
  registerExperiments(store); // load the experiments
  if (!DID_FETCH_DATA_ON_SERVER) {
    // GOTCHA: we can't initialize the experiments yet because the country
    // code might change as a result of the remote-config response, leading to
    // experiment cache/init errors because the `enabledSelector` return value
    // changes for many experiments based on the country code.
    await ExperimentManager(store).fetchAllNamespaces({ init: false });
  }

  /* istanbul ignore else */
  if (__IS_ALPHA_ENV__ || !__PRODUCTION__) {
    // on local and staging, assign the experiment manager instance to `Tubi.ExperimentManager` on the global scope.
    exposeToTubiGlobal({ ExperimentManager: ExperimentManager(store) });
  }
};

export const initExperimentManager = (store: TubiStore) => {
  ExperimentManager(store).initAllExperiments();
};
