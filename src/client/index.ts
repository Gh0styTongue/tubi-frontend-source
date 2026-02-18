/* eslint-disable import/no-unused-modules */
/* eslint "@typescript-eslint/no-floating-promises": "error" */ // TODO: we should enable this for the entire repo
/**
 * Import css of "@adrise/web-ui" from scss files will generate wrong results,
 * so import it from js files.
 *
 * This including "normalize.css" and useful reset rules,
 * adjusting font-family and font-size also.
 */
import '@adrise/web-ui/lib/styles/global.css';
import '@tubitv/web-ui/lib/styles/global.css';
import '@tubitv/design/font.css';
import './styles/global.scss';

/**
 * THIS IS THE ENTRY POINT FOR THE CLIENT, JUST LIKE server.js IS THE ENTRY POINT FOR THE SERVER.
 */
import 'core-js';
import 'whatwg-fetch';
import 'console-polyfill';

import { locationsAreEqual } from 'history';

import { listenBefore, setupHistory } from 'client/routing';
import { tasksBeforeFetchData, requestsBeforeFetchData, tasksAfterFetchData, tasksBeforeRouteMatch, tasksAfterInit } from 'client/setup';
import { createReduxStore } from 'client/setup/tasks/createReduxStore';
import { setupOttDeepLink } from 'client/setup/tasks/setupOttDeepLink';
import { SHOULD_FETCH_DATA_ON_SERVER } from 'common/constants/constants';
import ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import getRoutes from 'common/routes';
import { ImpressionsManager } from 'common/services/ImpressionsManager';

// eslint-disable-next-line no-console -- log the release hash
try { console.log(`RELEASE: ${__RELEASE_HASH__}`); } catch (e) { /* ignore */ }

if (__OTTPLATFORM__ === 'FIRETV_HYB') {
  require('./keplerBridge').setup();
}

if (__DEVELOPMENT__) {
  if (module.hot) {
    module.hot.accept();
  }
}

const initClient = async () => {
  // preparations
  const apiClient = new ApiClient();
  const store = createReduxStore(apiClient);
  const history = setupHistory(store);
  ImpressionsManager.getInstance(store, apiClient);

  await tasksBeforeRouteMatch(store, apiClient);

  const routes = getRoutes(store);

  tasksBeforeFetchData({ store, history });

  // If data was fetched on the server, we can run tasks immediately. Otherwise,
  // we'll need to fetch the data now (on the client) before running the tasks.
  //
  // Samsung is a special case - for samsung we fetch data on the server but we
  // don't use that fetched data to render the components.
  // if we're in failsafe mode, we need to fetch data on the client side.
  if (SHOULD_FETCH_DATA_ON_SERVER || (__OTTPLATFORM__ === 'TIZEN' && !__IS_FAILSAFE__)) {
    await tasksAfterFetchData({ store, history, routes });
  } else {
    await requestsBeforeFetchData({ store, history });
    const runListenBefore = async () => {
      const locBefore = tubiHistory.getCurrentLocation();
      await listenBefore({
        location: locBefore,
        routes,
        store,
        history,
        runTasksAfterRedirection: true,
        continueTransition: async () => {
          const locAfter = tubiHistory.getCurrentLocation();
          if (!locationsAreEqual(locBefore, locAfter)) {
            // redirect detected; we need to run listenBefore again. This can
            // happen when we're in failsafe mode (so no server-side deeplink
            // redirect) and one of the routes has a react-router onEnter hook
            // that calls the `replace` function. We also need to call
            // setupOttDeepLink again to setup deeplink back-overrides.
            setupOttDeepLink(locAfter, store.dispatch);
            await runListenBefore();
            return;
          }
          await tasksAfterFetchData({ store, history, routes });
        },
      });
    };
    await runListenBefore();
  }

  tasksAfterInit(store, apiClient);
};

initClient()
  .catch((error) => logger.error(error, 'Client-side initialization failed'));
