import { isCacheValid as cacheValid } from '@tubitv/refetch';
import type { Location } from 'history';
import { createSelector } from 'reselect';

import {
  FEATURED_CONTAINER_ID,
  HISTORY_CONTAINER_ID,
} from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import {
  activeContainerIdSelector,
  containerChildrenIdMapSelector,
  containerLoadIdMapSelector,
  containerSelector,
  ottSideMenuSelector,
  userModifiableContainerIdsSelector,
} from 'common/selectors/container';
import { isMyStuffPageActiveSelector } from 'common/selectors/contentMode';
import type StoreState from 'common/types/storeState';
import { isKidsModeOrIsParentalRatingOlderKidsOrLess } from 'common/utils/ratings';

export const isCWPromptActiveSelector = (state: StoreState) => {
  const { fire } = state;
  const { containerId } = fire.containerUI;
  const isLoggedIn = isLoggedInSelector(state);
  return containerId === HISTORY_CONTAINER_ID && !isLoggedIn;
};

export const homeActiveContainerIdSelector = createSelector(
  isCWPromptActiveSelector,
  isMyStuffPageActiveSelector,
  (state: StoreState, { pathname }: { pathname: string }) => {
    const { containerChildrenIdMap } = containerSelector(state, { pathname });
    const { containerId } = state.fire.containerUI;
    const isEmpty = !(containerChildrenIdMap[containerId]?.length > 0);
    return isEmpty;
  },
  (state: StoreState) => state.fire.containerUI.containerId,
  activeContainerIdSelector,
  (isCWPromptActive, isMyStuffPageActive, isEmpty, containerId, containerIdFromSelector) => {
    let activeContainerId = containerId;
    if (isEmpty && !isCWPromptActive && !isMyStuffPageActive) {
      // find the first non empty container
      activeContainerId = containerIdFromSelector;
    }
    return activeContainerId || FEATURED_CONTAINER_ID;
  }
);

export const isSwitchingModeSelector = createSelector(
  ottSideMenuSelector,
  containerSelector,
  (containersInMenu, { isFetching, ttl, nextContainerIndexToLoad }) => {
    const isCacheValid = typeof ttl === 'number' ? cacheValid(ttl) : true;
    const hasValidContainers = containersInMenu.length && isCacheValid && nextContainerIndexToLoad !== 0;
    const isSwitchingContentMode = isFetching && !hasValidContainers;
    return isSwitchingContentMode;
  }
);

export const isUserRelatedContainerFullyLoadedSelector = createSelector(
  isMyStuffPageActiveSelector,
  containerLoadIdMapSelector,
  userModifiableContainerIdsSelector,
  (isMyStuffPageActive, containerLoadIdMap, userModifiableContainerIds) => {
    return isMyStuffPageActive && userModifiableContainerIds.every(id => containerLoadIdMap[id] && containerLoadIdMap[id]?.loaded);
  }
);

export const isUserRelatedContainerEmptySelector = createSelector(
  isMyStuffPageActiveSelector,
  isUserRelatedContainerFullyLoadedSelector,
  containerChildrenIdMapSelector,
  userModifiableContainerIdsSelector,
  (isMyStuffPageActive, loaded, childrenMap, userModifiableContainerIds) => {
    if (!isMyStuffPageActive || !loaded) {
      return false;
    }
    return userModifiableContainerIds.every(id => (childrenMap[id]?.length ?? 0) === 0);
  }
);

export const showMyStuffPromptSelector = createSelector(
  isMyStuffPageActiveSelector,
  isUserRelatedContainerEmptySelector,
  isLoggedInSelector,
  (isMyStuffPageActive, isUserRelatedContainerEmpty, isLoggedIn) => {
    return isMyStuffPageActive && (isUserRelatedContainerEmpty || !isLoggedIn);
  }
);

export const shouldShowVibesSelector = createSelector(
  (state: StoreState) => isKidsModeOrIsParentalRatingOlderKidsOrLess(state),
  (state: StoreState, { currentLocation }: {currentLocation: Location}) => currentLocation.pathname,
  (isKidsModeOrIsParentalRatingOlderKidsOrLess, pathname) => {
    return !isKidsModeOrIsParentalRatingOlderKidsOrLess && (pathname === OTT_ROUTES.home || pathname === OTT_ROUTES.tvMode || pathname === OTT_ROUTES.movieMode);
  }
);

export const shouldShowTop10VibesOnTile = createSelector(
  (state: StoreState, { currentLocation }: {currentLocation: Location}) => currentLocation.pathname,
  (pathname) => {
    const allowedRoutes: string[] = [OTT_ROUTES.home, OTT_ROUTES.myStuff, OTT_ROUTES.tvMode, OTT_ROUTES.movieMode, OTT_ROUTES.search];
    return allowedRoutes.includes(pathname);
  }
);

export const shouldShowTop10VibesOnTopDetail = createSelector(
  (state: StoreState, { currentLocation }: {currentLocation: Location}) => currentLocation.pathname,
  (pathname) => {
    // For top detail, exclude search page here to avoid impact webott_show_metadata_on_search experiment
    // https://app.shortcut.com/tubi/story/816253/display-title-metadata-on-hover-in-search-results-on-ott#activity-841739
    const allowedRoutes: string[] = [OTT_ROUTES.home, OTT_ROUTES.myStuff, OTT_ROUTES.tvMode, OTT_ROUTES.movieMode];
    return allowedRoutes.includes(pathname);
  }
);
