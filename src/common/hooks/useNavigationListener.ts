import type { Location } from 'history';
import { useEffect, useRef } from 'react';

import tubiHistory from 'common/history';

/**
 * This hook is used to listen to navigation events and call a callback function when the navigation occurs.
 */
export const useNavigationListener = (callback: (currentLocation: Location, nextLocation: Location) => void) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unlisten = tubiHistory.listenBefore((nextLocation, continueTransition) => {
      const currentLocation = tubiHistory.getCurrentLocation();
      callbackRef.current(currentLocation, nextLocation);
      continueTransition(undefined);
    });

    return unlisten;
  }, []);
};
