import type { Location } from 'history';
import { useCallback, useEffect, useRef, useState } from 'react';

import { WEB_ROUTES } from 'common/constants/routes';
import { useGetLivePlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetLivePlayerInstance';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import useLatest from 'common/hooks/useLatest';
import { useNavigationListener } from 'common/hooks/useNavigationListener';
import { useWebPlayerPipExperiment, useWebPlayerPipExposureLogger } from 'common/selectors/experiments/webPlayerPipSelector';
import { removeLocalePrefix } from 'common/utils/urlManipulation';
import { usePlayerPortal } from 'web/features/playback/contexts/playerPortalContext/playerPortalContext';

import { useIsCasting } from '../../VideoDetail/PlayerArea/hooks/useIsCasting';

const testMoviePage = new RegExp(`^${WEB_ROUTES.movies}/[^/]+/[^/]+$`);
const testSeriesPage = new RegExp(`^${WEB_ROUTES.tvShows}/[^/]+(?:/[^/]+)?$`);

/**
 * This utility function is used to determine if the the location is a page that
 * contains a video player
 */
const isPlayerPage = (nextLocation: Location) => {
  const pathname = removeLocalePrefix(nextLocation.pathname);
  return testMoviePage.test(pathname)
    || (testSeriesPage.test(pathname) && pathname !== WEB_ROUTES.tvShows)
    || pathname.startsWith(WEB_ROUTES.live);
};

const isSupportPage = (nextLocation: Location) => {
  const pathname = removeLocalePrefix(nextLocation.pathname);
  return pathname.startsWith(WEB_ROUTES.support);
};

const isHelpCenterPage = (nextLocation: Location) => {
  const pathname = removeLocalePrefix(nextLocation.pathname);
  return pathname.startsWith(WEB_ROUTES.helpCenter);
};

/**
 * This hook is used to handle setting the display mode to floating when navigating
 * to a different page from the video detail page
 */
function useSetupFloatingPlayerWhenNavigating() {
  const isWebPipFeatureEnabled = useWebPlayerPipExperiment();
  const logExposure = useWebPlayerPipExposureLogger();
  const { getPlayerInstance } = useGetPlayerInstance();
  const { getLivePlayerInstance } = useGetLivePlayerInstance();
  const { setIsFloating, isFloating, destroyPlayers } = usePlayerPortal();
  const setIsFloatingRef = useLatest(setIsFloating);
  const { isCasting } = useIsCasting();

  // Track the actual previous location to handle POP navigation correctly
  const previousLocationRef = useRef<Location | null>(null);

  /**
   * To ensure the floating state is updated after React's render cycle,
   * we use a state flag to signal when the floating state should change.
   * The actual update occurs in the cleanup function of useEffect.
  */
  const [needToCallToSet, setNeedToCallToSet] = useState(false);

  const onNavigation = useCallback((currentLocation: Location, nextLocation: Location) => {
    const isPlayerPlaying = !!getPlayerInstance()?.isPlaying() || !!getLivePlayerInstance();

    /**
     * For POP navigation (back/forward), we use our tracked previous location
     * as the "current" because the navigation listener's currentLocation
     * might already be updated
     */
    const actualCurrentLocation = nextLocation.action === 'POP' && previousLocationRef.current
      ? previousLocationRef.current
      : currentLocation;

    const isCurrentLocationPlayerPage = isPlayerPage(actualCurrentLocation);
    const isNavigatingToPlayerPage = isPlayerPage(nextLocation);
    const isNavigatingToSupportPage = isSupportPage(nextLocation);
    const isNavigatingToHelpCenterPage = isHelpCenterPage(nextLocation);

    /**
     * We only want to log the exposure at the moment we would switch
     * to the floating player for both control and treatment groups.
     */
    const shouldLogExposure = !isCasting
      && isPlayerPlaying
      && isCurrentLocationPlayerPage
      && !isNavigatingToPlayerPage
      && !isNavigatingToSupportPage
      && !isNavigatingToHelpCenterPage;

    if (shouldLogExposure) {
      logExposure();
    }

    // Track the location for the next navigation
    previousLocationRef.current = nextLocation;

    if (!isWebPipFeatureEnabled) {
      return;
    }

    const shouldSwitchToFloatingPlayer = !isFloating && shouldLogExposure;

    const shouldSwitchToInlinePlayer = isFloating
      && isNavigatingToPlayerPage
      && !isCurrentLocationPlayerPage;

    const isNavigatingAwayFromPlayerPageWithPausedVideo = !isPlayerPlaying
      && !isNavigatingToPlayerPage
      && isCurrentLocationPlayerPage;

    const shouldDestroyPlayers = isNavigatingAwayFromPlayerPageWithPausedVideo || isNavigatingToSupportPage;

    if (shouldSwitchToFloatingPlayer) {
      setNeedToCallToSet(true);
    } else if (shouldSwitchToInlinePlayer) {
      setIsFloatingRef.current(false);
    } else if (shouldDestroyPlayers) {
      destroyPlayers();
    }
  }, [
    isWebPipFeatureEnabled,
    setIsFloatingRef,
    isFloating,
    getPlayerInstance,
    getLivePlayerInstance,
    isCasting,
    destroyPlayers,
    logExposure,
  ]);

  /**
   * Delay the setting of the floating state to after React's render cycle
   * to ensure the floating state is set after the VideoDetail component has unmounted
   * in order to properly track VOD playback session end
   */
  useEffect(() => {
    if (needToCallToSet) {
      setNeedToCallToSet(false);
      const setIsFloating = setIsFloatingRef.current;
      return () => {
        setIsFloating(true);
      };
    }
  }, [needToCallToSet, setIsFloatingRef]);

  useNavigationListener(onNavigation);
}

export const SetupFloatingPlayerWhenNavigatingWrapper = () => {
  useSetupFloatingPlayerWhenNavigating();
  return null;
};
