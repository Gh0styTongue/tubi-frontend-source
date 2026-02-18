import { createSelector } from 'reselect';

import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isUserCoppaCompliantSelector } from 'common/features/coppa/selectors/coppa';
import { isAgeGateModalVisibleSelector, userAgentSelector } from 'common/selectors/ui';
import type { StoreState } from 'common/types/storeState';
import { matchesRoute } from 'common/utils/urlPredicates';
import { blockedRoutes } from 'web/features/authentication/utils/googleOneTap';

export const isOneTapEnabledForCurrentPageSelector = createSelector(
  (_state: StoreState, props: { pathname: string }) => props.pathname,
  (pathname) => {
    if (!pathname) return false;
    const currentPath = pathname;
    const hasMatch = blockedRoutes.some(({ route }) => {
      return matchesRoute(route, currentPath);
    });
    return !hasMatch;
  },
);

export const isGuestUserCoppaCompliantSelector = createSelector(
  isLoggedInSelector,
  isUserCoppaCompliantSelector,
  isAgeGateModalVisibleSelector,
  (isLoggedIn, isUserCoppaCompliant, isAgeGateModalVisible) => {
    return !isLoggedIn && isUserCoppaCompliant && !isAgeGateModalVisible;
  }
);

export const shouldShowOneTapPromptSelector = createSelector(
  isGuestUserCoppaCompliantSelector,
  isOneTapEnabledForCurrentPageSelector,
  (isGuestUserCoppaCompliant, isOneTapEnabledForCurrentPage) => {
    return isGuestUserCoppaCompliant && isOneTapEnabledForCurrentPage;
  }
);

export const isFedCMSupportedSelector = createSelector(
  userAgentSelector,
  (userAgent) => {
    const { name: browserName, version } = userAgent.browser;
    const browserVersion = Number(version?.split('.')[0]) || Number.NEGATIVE_INFINITY;
    return __WEBPLATFORM__ === 'WEB' && browserName === 'Chrome' && browserVersion >= 121;
  },
);
