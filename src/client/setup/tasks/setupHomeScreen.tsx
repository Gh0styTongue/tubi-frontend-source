import { loadHomeScreen } from 'common/actions/container';
import { loadVideoById } from 'common/actions/video';
import { HOME_DATA_SCOPE } from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import OTTFireTVPreloadVideoContent from 'common/experiments/config/ottFireTVPreloadVideoContent';
import { isUserNotCoppaCompliantSelector } from 'common/features/coppa/selectors/coppa';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import { ottFireTVPreloadVideoContentSelector } from 'common/selectors/experiments/ottFireTVPreloadVideoContentSelector';
import type { TubiStore } from 'common/types/storeState';
import { isOTTPlaybackUrl } from 'common/utils/urlPredicates';

import { getRequestInfo } from './setupIntroVideo';

export const setupHomeScreenStatus = { hasBeenCalled: false };

export const needLoadHomeScreenInParallel = (pathname: string) => {
  return (
    __ISOTT__ &&
    __IS_FAILSAFE__ &&
    __OTTPLATFORM__ !== 'TIZEN' &&
    !setupHomeScreenStatus.hasBeenCalled &&
    (pathname === OTT_ROUTES.home || pathname.startsWith(OTT_ROUTES.onboarding.split(':')[0]))
  );
};

export const needLoadVideoContentInParallel = (pathname: string) => {
  return (
    __ISOTT__ &&
    __IS_FAILSAFE__ &&
    __OTTPLATFORM__ !== 'TIZEN' &&
    isOTTPlaybackUrl(pathname)
  );
};

export const setupHomeScreen = async (store: TubiStore) => {
  const location = tubiHistory.getCurrentLocation();
  if (needLoadHomeScreenInParallel(location.pathname)) {
    await store
      .dispatch(
        loadHomeScreen({
          scope: HOME_DATA_SCOPE.firstScreen,
          location,
        })
      )
      .catch((error) => {
        logger.error(error, 'Failed to load homescreen before route match');
      });
  }
  setupHomeScreenStatus.hasBeenCalled = true;
};

export const setupVideoContentLoad = (store: TubiStore) => {
  const { path: pathname } = getRequestInfo();
  const state = store.getState();
  const shouldPreloadVideoContent = ottFireTVPreloadVideoContentSelector(store.getState());
  const needLoadVideoContent = needLoadVideoContentInParallel(pathname);
  if (needLoadVideoContent) {
    OTTFireTVPreloadVideoContent(store).logExposure();
  }
  if (shouldPreloadVideoContent && needLoadVideoContentInParallel(pathname)) {
    const forceKidsModeParams = {
      isKidsMode: false,
      force: false,
    };
    if (isUserNotCoppaCompliantSelector(state)) {
      // User is not COPPA compliant, limit content to kids mode
      forceKidsModeParams.isKidsMode = true;
      // Force true to avoid taking result from cache since variable isKidsMode is not part of the cache key
      forceKidsModeParams.force = true;
    }
    const contentId = pathname.split('/')[3];
    if (!contentId) return;
    window.__preloadVideoContentPromise__ = store.dispatch(loadVideoById(contentId, forceKidsModeParams));
  }
};
