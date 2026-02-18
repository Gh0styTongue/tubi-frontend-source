import type { History } from 'history';
import React, { StrictMode } from 'react';
import { hydrateRoot, createRoot } from 'react-dom/client';
import type { PlainRoute, RouterProps } from 'react-router';
import { match, Router } from 'react-router';

import {
  SHOULD_FETCH_DATA_ON_SERVER,
} from 'common/constants/constants';
import logger from 'common/helpers/logging';
import Main from 'common/helpers/Main';
import getRoutes from 'common/routes';
import type { TubiStore } from 'common/types/storeState';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';

export const renderPage = async (store: TubiStore, history: History) => {
  const routes = getRoutes(store);
  const location = __OTTPLATFORM__ === 'TIZEN' ? getCurrentPathname() : /* istanbul ignore next */ document.location;

  await new Promise((resolve: (value?: unknown) => void, reject) => {
    match({ routes, history, location }, async (error, _redirectLocation, routerProps) => {
      try {
        // istanbul ignore next
        if (error) {
          logger.error(error, 'Error while matching route (renderPage)');
        }
        await renderPageContent(store, routerProps);
        resolve();

      } catch (e) /* istanbul ignore next */ {
        reject(e);
      }
    });
  });
};

const renderPageContent = async (store: TubiStore, routerProps: PlainRoute[]) => {
  try {
    // Only apply react-router-scroll for non-OTT apps
    let reactRouterRenderProp: RouterProps['render'];

    // istanbul ignore next
    if (!__ISOTT__) {
      const applyRouterMiddleware = await import('react-router').then(
        ({ applyRouterMiddleware }) => applyRouterMiddleware
      );
      const scrollMiddleware = await import('react-router-scroll' as string).then(({ useScroll }) => useScroll);
      reactRouterRenderProp = applyRouterMiddleware(scrollMiddleware()) as unknown as RouterProps['render'];
    }
    await new Promise((resolve) => {
      let content = (
        <Main
          store={store}
          router={<Router {...routerProps} render={reactRouterRenderProp} />}
          languageLocale={store.getState().ui.userLanguageLocale}
          onMount={resolve}
        />
      );

      // istanbul ignore next -- no need to test dev stuff
      if (__REACT_STRICT_MODE__) {
        content = <StrictMode>{content}</StrictMode>;
      }

      const container = document.getElementById('content')!;
      if (SHOULD_FETCH_DATA_ON_SERVER) {
        hydrateRoot(container, content);
      } else {
        createRoot(container).render(content);
      }
    });

  } catch (error) /* istanbul ignore next */ {
    logger.error(error, 'Error while rendering (renderPageContent)');
    throw error;
  }
};

/* istanbul ignore next -- no need to test dev stuff */
export const setupDevHMR = (store: TubiStore, history: History) => {
  if (__DEVELOPMENT__) {
    if (module.hot) {
      module.hot.accept('common/routes', () => {
        renderPage(store, history);
      });
    }
  }
};
