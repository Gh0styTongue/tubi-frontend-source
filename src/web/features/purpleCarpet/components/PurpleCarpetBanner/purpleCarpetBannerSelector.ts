import { createSelector } from 'reselect';

import { VIEWPORT_TYPE } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isPurpleCarpetContentSelector, mainGameSelector, shouldShowPurpleCarpetSelector } from 'common/features/purpleCarpet/selector';
import { PurpleCarpetStatus } from 'common/features/purpleCarpet/type';
import { viewportTypeSelector } from 'common/selectors/ui';
import type { StoreState } from 'common/types/storeState';
import { isWebDetailsPageUrl } from 'common/utils/urlPredicates';

export const bottomBannerSize = {
  lg: 136,
  m: 96,
  s: 56,
};

/**
 * Extracts the content ID from a given URL path based on a specified string match.
 *
 * @param {string} urlPath - The URL path from which to extract the content ID.
 * @param {string} stringMatch - The string to match in the URL path to locate the content ID.
 * @returns {string} - The extracted content ID, or an empty string if not found.
 */
const getContentIdFromUrlPath = (urlPath = '', stringMatch: string) => {
  const urlStr = urlPath.split('?')[0];
  const contentStr = urlStr.split(`${stringMatch}/`)[1];
  return contentStr ? contentStr.split('/')[0] : '';
};

export const enum PurpleCarpeBannerPosition {
  TOP = 'top',
  BOTTOM = 'bottom',
  NONE = 'none',
}

export const enum PurpleCarpeBannerType {
  COMING_SOON = 'coming_soon',
  WATCH_ON_APP = 'watch_on_app',
  DISASTER = 'disaster',
  NONE = 'none'
}

export const purpleCarpetBannerSelector = createSelector(
  shouldShowPurpleCarpetSelector,
  (state: StoreState, { pathname }: { pathname: string }) => {
    const contentIdFromUrl = getContentIdFromUrlPath(pathname, '/movies');
    return isPurpleCarpetContentSelector(state, contentIdFromUrl);
  },
  (state: StoreState) => state.purpleCarpet.status,
  viewportTypeSelector,
  isLoggedInSelector,
  mainGameSelector,
  (_: StoreState, { pathname }: { pathname: string }) => pathname,
  (shouldShowPurpleCarpet, isPurpleCarpetContent, status, viewportType, isLoggedIn, mainGameId, pathname) => {
    let position = PurpleCarpeBannerPosition.NONE;
    let height = 0;
    let type = PurpleCarpeBannerType.NONE;

    const isMobile = viewportType === VIEWPORT_TYPE.mobile;
    const isPurpleCarpetDetailsPage = isWebDetailsPageUrl(pathname) && isPurpleCarpetContent;
    const isPurpleCarpetEnabledPage = pathname === WEB_ROUTES.home || isPurpleCarpetDetailsPage;
    if (pathname === WEB_ROUTES.disasterMode) {
      return {
        position: isMobile ? PurpleCarpeBannerPosition.BOTTOM : PurpleCarpeBannerPosition.TOP,
        height: bottomBannerSize.s,
        type: PurpleCarpeBannerType.DISASTER,
      };
    }
    if (!shouldShowPurpleCarpet || !isPurpleCarpetEnabledPage) {
      return { position, height, type };
    }

    switch (status) {
      case PurpleCarpetStatus.Banner:
        if (mainGameId) {
          height = bottomBannerSize.s;
          type = PurpleCarpeBannerType.COMING_SOON;
          if (isMobile) {
            position = PurpleCarpeBannerPosition.BOTTOM;
            if (!isLoggedIn) {
              height = bottomBannerSize.lg;
            }
          } else {
            position = PurpleCarpeBannerPosition.TOP;
          }
        }
        break;
      case PurpleCarpetStatus.BeforeGame:
      case PurpleCarpetStatus.DuringGame:
        if (isPurpleCarpetDetailsPage) {
          if (isMobile) {
            position = PurpleCarpeBannerPosition.BOTTOM;
            height = bottomBannerSize.m;
          } else {
            position = PurpleCarpeBannerPosition.TOP;
            height = bottomBannerSize.s;
          }
          type = PurpleCarpeBannerType.WATCH_ON_APP;
        }
        break;
      default:
        break;
    }

    return { position, height, type };
  }
);
