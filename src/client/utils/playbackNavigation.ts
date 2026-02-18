import { addQueryStringToUrl, parseQueryString } from '@adrise/utils/lib/queryString';
import type { Location } from 'history';

import { OTT_ROUTES } from 'common/constants/routes';
import { needsLoginSelector } from 'common/features/authentication/selectors/needsLogin';
import { getContentIdFromUrlPath } from 'common/features/ottDeeplink/platforms/firetv-hyb';
import { extractUtmParams } from 'common/features/ottDeeplink/utils/ottDeeplink';
import { isDeepLinkedSelector } from 'common/selectors/deepLink';
import { byIdSelector } from 'common/selectors/video';
import type StoreState from 'common/types/storeState';
import { timeDiffInDays } from 'common/utils/date';
import { getUrlByVideo } from 'common/utils/urlConstruction';
import { isOTTPlaybackUrl } from 'common/utils/urlPredicates';

/**
 * We would redirect to the detail page before rendering player for these cases:
 * 1. To avoid showing the error modal on the player page, as the video_resource is empty for the coming soon contents.
 * 2. When title needs login, and is not from autoplay.
 */
/**
 * Determines if a redirect to the detail page is needed before rendering the player.
 * @param {Location} location - The current location object, containing pathname and search.
 * @param {StoreState} state - The Redux store state.
 * @returns {string|null} The URL to redirect to, or null if no redirect is needed.
 */
export const getRedirectUrlFromPlayback = (location: Location, state: StoreState) => {
  const { pathname, search } = location;
  let contentId;
  if (isOTTPlaybackUrl(pathname)) {
    contentId = getContentIdFromUrlPath(pathname, OTT_ROUTES.player.split('/:')[0])
      || getContentIdFromUrlPath(pathname, OTT_ROUTES.androidPlayer.split('/:')[0]);
  }
  if (!contentId) return null;

  const byId = byIdSelector(state);
  const video = byId[contentId];
  if (!video) return null;

  const isDeeplinked = isDeepLinkedSelector(state);
  const { policy_match, availability_starts } = video;
  const willBeAvailableWithInDays = availability_starts ? timeDiffInDays(new Date(availability_starts), new Date()) : -1;
  const isComingSoon = policy_match === false && willBeAvailableWithInDays > 0 && willBeAvailableWithInDays <= 30;

  const query = parseQueryString(search);
  const needsLogin = needsLoginSelector(state, contentId);
  const isFromAutoplay = !!query.autoplay;

  const shouldRedirectToDetailPage = (isDeeplinked && isComingSoon) || (needsLogin && !isFromAutoplay);

  const utmParams = extractUtmParams(query);

  return shouldRedirectToDetailPage ? addQueryStringToUrl(getUrlByVideo({ video }), utmParams) : null;
};

