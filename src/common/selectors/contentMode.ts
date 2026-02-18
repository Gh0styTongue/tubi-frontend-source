import { createSelector } from 'reselect';

import { CONTENT_MODES } from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import { isEspanolModeEnabledSelector } from 'common/selectors/ui';
import type StoreState from 'common/types/storeState';
import { getContentModeFromPath } from 'common/utils/routePath';
import { matchesRoute } from 'common/utils/urlPredicates';

export const linearContentModeSelector = (state: StoreState) => {
  return state.contentMode.linear;
};

export const webContentModeSelector = createSelector(
  ({ ui: { isEspanolModeEnabled } }: StoreState) => isEspanolModeEnabled,
  (_state: StoreState, { pathname }: { pathname: string}) => getContentModeFromPath(pathname),
  (isEspanolModeEnabled, contentMode) =>
    isEspanolModeEnabled ? CONTENT_MODES.espanol : contentMode
);

export const isHomeOrContentModePage = (pathname: string) => {
  if (pathname === OTT_ROUTES.home) {
    return true;
  }
  const contentMode = getContentModeFromPath(pathname);
  return contentMode !== CONTENT_MODES.all;
};

export const isHomeOrContentModePageSelector = (_state: StoreState, { pathname }: { pathname: string }) =>
  isHomeOrContentModePage(pathname);

export const previousContentModeSelector = (state: StoreState) =>
  (__ISOTT__ ? state.ottUI : state.webUI).contentMode.previous;

// do not expand usage of this as _active is scheduled for deprecation
export const _activeCurrentContentModeSelector = (state: StoreState) =>
  (__ISOTT__ ? state.ottUI : state.webUI).contentMode._active;

export const ottContentModeSelector = createSelector(
  isHomeOrContentModePageSelector,
  previousContentModeSelector,
  (_state: StoreState, { pathname }: { pathname: string }) => pathname,
  isEspanolModeEnabledSelector,
  _activeCurrentContentModeSelector,
  (isHomeOrContentModePage, previousContentMode, pathname, isEspanolModeEnabled, _activeContentMode) => {
    const isContainersPage = matchesRoute(OTT_ROUTES.containers, pathname);
    if (isContainersPage) {
      return CONTENT_MODES.all;
    }
    if (isHomeOrContentModePage) {
      return getContentModeFromPath(pathname);
    }

    // This branch fixes a bug in which, when navigating to a details page, we
    // would see the contentMode as "latino" even when not in espanol mode due
    // to falling back to the previous content mode.
    const isVideoOrSeriesPage = matchesRoute(OTT_ROUTES.video, pathname) || matchesRoute(OTT_ROUTES.series, pathname);
    if (isVideoOrSeriesPage && previousContentMode === CONTENT_MODES.espanol && !isEspanolModeEnabled) {
      return _activeContentMode;
    }

    return previousContentMode;
  }
);
export const currentContentModeSelector = (state: StoreState, props: { pathname: string }) =>
  __ISOTT__
    ? ottContentModeSelector(state, props)
    : webContentModeSelector(state, props);

// for the web, in some cases, we want to show all containers even though user now is in movies or tvshows page
// used for get menu list on web now
export const contentModeForMenuListSelector = createSelector(
  currentContentModeSelector,
  (currentContentMode) => {
    return currentContentMode === CONTENT_MODES.espanol ? currentContentMode : CONTENT_MODES.all;
  }
);

export const isMyStuffPageActiveSelector = createSelector(
  currentContentModeSelector,
  (currentContentMode) => currentContentMode === CONTENT_MODES.myStuff,
);
