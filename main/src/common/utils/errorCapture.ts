import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import { SET_DEEPLINK_BACK_OVERRIDE } from 'common/constants/action-types';
import { BACK_FROM_LIVE_PLAYBACK_TO_HOME, BACK_FROM_PLAYBACK_TO_DETAIL, LINEAR_CONTENT_TYPE, VIDEO_CONTENT_TYPE, SERIES_CONTENT_TYPE, SPORTS_EVENT_CONTENT_TYPE, BACK_FROM_DETAIL_TO_HOME } from 'common/constants/constants';
import * as errTypes from 'common/constants/error-types';
import platformHash from 'common/constants/platforms';
import { OTT_ROUTES } from 'common/constants/routes';
import { getContentIdFromUrlPath } from 'common/features/ottDeeplink/platforms/firetv-hyb';
import { isDeepLinkedSelector, isDetailDeepLinkedSelector } from 'common/selectors/deepLink';
import { parentalRatingSelector } from 'common/selectors/userSettings';
import { byIdSelector } from 'common/selectors/video';
import type StoreState from 'common/types/storeState';
import type { TubiStore } from 'common/types/storeState';
import type { VideoType } from 'common/types/video';
import { getUrlByVideo } from 'common/utils/urlConstruction';

import { actionWrapper } from './action';
import { timeDiffInDays } from './date';
import { isAboveParentalLevel } from './ratings';
import { isDetailsPageUrl, isOTTPlaybackUrl } from './urlPredicates';

export enum PlayerErrors {
  SETUP_FAIL = 200,
  FATAL_ERROR = 201,
  HDCP_ERROR = 202,
  DRM_ERROR = 203,
}

export enum FetchDataErrors {
  FAIL = 100,
}

export enum NetworkErrors {
  OFFLINE = 300,
}

// explicitly indicate enums as this is present on the wiki page above.
export enum errorContexts {
  DEFAULT = 0,
  HOME = 1,
  VIDEO_DETAIL = 2,
  PLAYER = 3,
  SERIES_DETAIL = 4,
  EPISODE_PAGE = 5,
}

export const errorTypes = {
  FETCH_DATA: FetchDataErrors,
  PLAYER: PlayerErrors,
  NETWORK: NetworkErrors,
  DEFAULT: 0,
};

type ErrorWithErrType = Error & { errType: string };

export const createErrorWithErrType = (error: Error, errType: string): ErrorWithErrType => Object.assign(error, { errType });

/**
 * Util to generate error code for sending to support
 * @param context - where are we when it happens
 * @param type - what kind of error is it
 * @returns string - error for user to report => FTV-1-100
 */
export const buildErrorCode = (context: errorContexts, type: number = 0): string => {
  // https://tubitv.atlassian.net/wiki/spaces/EC/pages/798359880/User+Facing+Error+Codes
  /* istanbul ignore next: Add the optional chaining to prevent unit test crash only */
  if (__WEBPLATFORM__ === 'WEB') {
    return `WEB-${context}-${type}`;
  }
  if (__WEBPLATFORM__ === 'WINDOWS') {
    return `WIN-${context}-${type}`;
  }
  return `${platformHash[__OTTPLATFORM__]?.errorReportingAlias}-${context}-${type}`;
};

const messages = defineMessages({
  contactSupport: {
    description: 'contact support message text',
    defaultMessage: 'If this problem persists, please contact us at tubitv.com/support, and include the code: {errorCode}',
  },
});

/**
 * Builds out support/error string for you
 * @param errorCode - complete code like FTV-1-100
 * @returns {string}
 */
export const buildErrorMessage = (errorCode: string, intl: IntlShape): string => {
  return intl.formatMessage(messages.contactSupport, { errorCode });
};

/**
 * Decide if we want to direct the user to 404 page according to error type
 * @param errorType - error type string
 * @returns {boolean}
 */
export const checkIfErrorShouldRedirectTo404 = (errorType: undefined | string): boolean => {
  if (!errorType) return false;
  return [
    errTypes.INVALID_CONTENT_ID,
    errTypes.INVALID_CONTAINER_ID,
    errTypes.CONTENT_NOT_FOUND,
  ].includes(errorType);
};

export const checkIfDeepLinkToUnavailableContent = (pathname: string, state: StoreState) => {
  let contentId;
  if (isOTTPlaybackUrl(pathname) && isDeepLinkedSelector(state)) {
    contentId = getContentIdFromUrlPath(pathname, '/ott/player') || getContentIdFromUrlPath(pathname, '/ott/androidplayer');
  } else if (isDetailsPageUrl(pathname) && isDetailDeepLinkedSelector(state)) {
    contentId = getContentIdFromUrlPath(pathname, '/video') || getContentIdFromUrlPath(pathname, '/series');
  }
  if (!contentId) return false;

  const byId = byIdSelector(state);
  const content = byId[contentId];
  if (!content) return false;

  const { policy_match, availability_starts, ratings } = content;
  const parentalRating = parentalRatingSelector(state);
  const isRestricted = isAboveParentalLevel(parentalRating, ratings);
  const isExpired = !policy_match && (!availability_starts || timeDiffInDays(new Date(availability_starts), new Date()) > 30);
  return isRestricted || isExpired;
};

// To avoid showing the error modal on the player page, as the video_resource is empty for the coming soon contents.
// So we should redirect it to the detail page before that
export const redirectURLFromComingSoonPlaybackDeepLink = (pathname: string, state: StoreState) => {
  let contentId;
  if (isOTTPlaybackUrl(pathname) && isDeepLinkedSelector(state)) {
    contentId = getContentIdFromUrlPath(pathname, OTT_ROUTES.player.split('/:')[0])
      || getContentIdFromUrlPath(pathname, OTT_ROUTES.androidPlayer.split('/:')[0]);
  }
  if (!contentId) return false;

  const byId = byIdSelector(state);
  const video = byId[contentId];
  if (!video) return false;

  const { policy_match, availability_starts } = video;
  const willBeAvailableWithInDays = availability_starts ? timeDiffInDays(new Date(availability_starts), new Date()) : -1;
  const isComingSoon = policy_match === false && willBeAvailableWithInDays > 0 && willBeAvailableWithInDays <= 30;
  return isComingSoon ? getUrlByVideo({ video }) : false;
};

/**
 * We do not want to play live content within the VOD player
 * Sometimes we do have users going to VOD player with linear content ID
 * i.e. For comcast because assetType attribute is missing in the deeplink params
 * It is a problem from partner. We don't want to handle this kind of problem to redirect to
 * the right page, cause it is a small amount of traffic and it will introduce additional complexity
 * on our end and also maybe unwanted performance impact
 * @param contentType - content type string
 */
export const checkIfLiveContentInVodPlayer = (contentType: VideoType | undefined) => {
  if (contentType === LINEAR_CONTENT_TYPE || contentType === SPORTS_EVENT_CONTENT_TYPE) {
    const error = createErrorWithErrType(new Error('Live content is unallowed in VOD player'), errTypes.LIVE_CONTENT_PASSED_TO_VOD_PLAYER);
    throw error;
  }
};

/**
 * We do not want to play vod content within the live player either as above comments
 * @param contentType - content type string
 */
export const checkIfVodContentInLivePlayer = (contentType: VideoType | undefined) => {
  if (contentType === VIDEO_CONTENT_TYPE) {
    const error = createErrorWithErrType(new Error('Movie content is unallowed in live player'), errTypes.MOVIE_CONTENT_PASSED_TO_LIVE_PLAYER);
    throw error;
  } else if (contentType === SERIES_CONTENT_TYPE) {
    const error = createErrorWithErrType(new Error('TVShow content is unallowed in live player'), errTypes.TVSHOW_CONTENT_PASSED_TO_LIVE_PLAYER);
    throw error;
  }
};

export const fixMixedUpContentIdUrl = (url: string, errType: string, store?: TubiStore) => {
  let fixedUrl = url;
  const isDeeplink = url.includes('utm_source=');
  if (__ISOTT__ && store) {
    if (errType === errTypes.LIVE_CONTENT_PASSED_TO_VOD_PLAYER) {
      fixedUrl = url.replace(/^\/ott\/player/, '/ott/live');
      if (isDeeplink) {
        store.dispatch(
          actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, {
            data: {
              [BACK_FROM_PLAYBACK_TO_DETAIL]: false,
              [BACK_FROM_LIVE_PLAYBACK_TO_HOME]: true,
            },
          })
        );
      }
    } else if (errTypes.VOD_CONTENT_PASSED_TO_LIVE_PLAYER.includes(errType)) {
      fixedUrl = url.replace(/^\/ott\/live/, '/ott/player');
      if (isDeeplink) {
        store.dispatch(
          actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, {
            data: {
              [BACK_FROM_PLAYBACK_TO_DETAIL]: true,
              [BACK_FROM_LIVE_PLAYBACK_TO_HOME]: false,
              [BACK_FROM_DETAIL_TO_HOME]: true,
            },
          })
        );
      }
    }
  } else {
    if (errType === errTypes.LIVE_CONTENT_PASSED_TO_VOD_PLAYER) {
      fixedUrl = url.replace(/^\/(movies|tv-shows)/, '/live');
    } else if (errType === errTypes.MOVIE_CONTENT_PASSED_TO_LIVE_PLAYER) {
      fixedUrl = url.replace(/^\/live/, '/movies');
    } else if (errType === errTypes.TVSHOW_CONTENT_PASSED_TO_LIVE_PLAYER) {
      fixedUrl = url.replace(/^\/live/, '/tv-shows');
    }
  }
  return fixedUrl;
};
