import { createSelector } from 'reselect';

import { VIEWPORT_TYPE } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLiveEventContentSelector } from 'common/features/liveEvent/selectors';
import { isMobileDeviceSelector, viewportTypeSelector } from 'common/selectors/ui';
import type StoreState from 'common/types/storeState';
import { getContentIdFromLiveDetailsPage, matchesRoute } from 'common/utils/urlPredicates';

export const isLiveEventDetailsPageSelector = (state: StoreState, { pathname }: { pathname: string }) => {
  if (!pathname) {
    return false;
  }
  if (matchesRoute(WEB_ROUTES.nfl, pathname.toLowerCase())) {
    return true;
  }
  const contentId = getContentIdFromLiveDetailsPage(pathname);
  if (contentId) {
    return isLiveEventContentSelector(state, contentId);
  }
  return false;
};

export const shouldShowLiveEventBannerSelector = createSelector(
  isLiveEventDetailsPageSelector,
  viewportTypeSelector,
  isMobileDeviceSelector,
  (isLiveEventDetailsPage, viewportType, isMobile) => {
    return isLiveEventDetailsPage && viewportType === VIEWPORT_TYPE.desktop && !isMobile;
  },
);

