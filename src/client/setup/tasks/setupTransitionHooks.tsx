import type { History, Location } from 'history';
import type { PlainRoute } from 'react-router';

import { listenAfter, listenBefore } from 'client/routing';
import type { TubiStore } from 'common/types/storeState';

export const setupTransitionHooks = (history: History, store: TubiStore, routes: PlainRoute[]) => {
  // pass in a way of redirecting by changing the browser URL, not using history.pushState().
  // Doing it this way allows for easier testing since JSDOM doesn't allow setting of window.location.href.
  const hardRedirect = (url: string) => (window.location.href = url);
  history.listenBefore((location, continueTransition) => {
    store.pauseNotifications();
    listenBefore({
      history,
      store,
      routes,
      location,
      hardRedirect,
      continueTransition: () => {
        // We need to keep these 2 actions as close together as possible to
        // ensure react batches the changes together.
        continueTransition(undefined);
        store.resumeNotifications();
      },
    })
      .finally(() => {
        // just in case continueTransition is not called (it may not be) or
        // listenBefore failed, we need to make sure we resume notifications
        // so we can show error modals, etc.
        store.resumeNotifications();
      });
  });
  const handleLocationChange = (location: Location) => {
    listenAfter({ history, store, routes, location });
  };
  history.listen(handleLocationChange);
  handleLocationChange(history.getCurrentLocation());
};
