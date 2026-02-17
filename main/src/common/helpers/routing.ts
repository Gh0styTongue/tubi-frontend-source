import { addQueryStringToUrl, parseQueryString, queryStringify } from '@adrise/utils/lib/queryString';
import { days, mins, isSameDay, secs } from '@adrise/utils/lib/time';
import type express from 'express';
import Cookie from 'react-cookie';
import type { RouterState as NextState, RedirectFunction as Replace } from 'react-router';
import type { Store } from 'redux';

import { getLocalData } from 'client/utils/localDataStorage';
import { clearContainerGridIDs } from 'common/actions/containerGrid';
import { setIsFirstSession } from 'common/actions/fire';
import { resetEPGActiveContent, setEPGActiveContent, setFeaturesEducated } from 'common/actions/ottUI';
import { getFirstEpisodeContentIdIfSeriesId, setFullscreen, setKidsMode, toggleAgeGateModal, setPreferredLocale } from 'common/actions/ui';
import { loadVideoById } from 'common/actions/video';
import { persistIsValidUserForPersonalization } from 'common/actions/webUI';
import { SET_DEEPLINK_BACK_OVERRIDE } from 'common/constants/action-types';
import type {
  CONTENT_MODE_VALUE } from 'common/constants/constants';
import {
  BACK_FROM_CONTAINER_TO_HOME,
  DEEPLINK_KIDSMODE_IDENTIFIER,
  HISTORY_CONTAINER_ID,
  HISTORY_CONTAINER_LEAVING_SOON_ID,
  QUEUE_CONTAINER_ID,
  QUEUE_CONTAINER_LEAVING_SOON_ID,
  SERIES_CONTENT_TYPE,
  CONTENT_MODES,
  LD_FEATURE_EDUCATED,
  FEATURE_TO_EDUCATE,
  ALL_FEATURES_EDUCATED,
  NON_FEATURES_EDUCATED,
  CONSENT_REDIRECT_FROM_QUERY_PARAM,
  LINEAR_CONTENT_TYPE,
} from 'common/constants/constants';
import {
  PERSONALIZATION_PROMPT_FOR_NEW_USERS_WITHIN_7_DAYS,
  FIRST_LOAD_PAGE_IS_CATEGORIES_ON_WEB,
  IS_VALID_USER_FOR_PERSONALIZATION,
} from 'common/constants/cookies';
import {
  ROUTING_BLOCKED,
} from 'common/constants/error-types';
import { MAGIC_LINK_STATUS } from 'common/constants/magic-link';
import { LGTV_DEEPLINK_PARAM_NAME, LGTV_DEEPLINK_CONTENT_ID_NAME, ottDeeplinkLaunchPoint, ottDeeplinkRequiredParameter, LGTV_DEEPLINK_CONTENT_TARGET_NAME } from 'common/constants/ott-deeplink';
import {
  LG_DEEPLINK_PAGES,
  OTT_ROUTES,
  WEB_ROUTES,
  OTT_LIVE_PLAYER_ROUTE_PREFIX,
  OTT_CONSENT_BLACKLIST_ROUTES,
  OTT_CONSENT_PAGE,
  LOCALIZED_WEB_ROUTES,
} from 'common/constants/routes';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import OttFireTVTitleOnboardingPersonalization from 'common/experiments/config/ottFireTVTitleOnboardingPersonalization';
import { load as loadAuth } from 'common/features/authentication/actions/auth';
import { verifyResetToken } from 'common/features/authentication/actions/pwdReset';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isUserNotCoppaCompliantSelector, isAgeGateRequiredSelector, isCoppaEnabledSelector } from 'common/features/coppa/selectors/coppa';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import { shouldEnableDisasterMode } from 'common/features/purpleCarpet/selector';
import { isPurpleCarpetContent } from 'common/features/purpleCarpet/util';
import tubiHistory from 'common/history';
import { currentContentModeSelector } from 'common/selectors/contentMode';
import { isSupportEspanolModeSelector } from 'common/selectors/espanolMode';
import { webAllCategoriesExperimentSelector } from 'common/selectors/experiments/webAllCategories';
import { shouldShowOTTLinearContentSelector } from 'common/selectors/ottLive';
import { isUserQualifiedForPersonalizationExperiment, shouldShowTitlePersonalizationPrompt } from 'common/selectors/personalization';
import { isMajorEventFailsafeActiveSelector } from 'common/selectors/remoteConfig';
import { isUsCountrySelector } from 'common/selectors/ui';
import { isWebLiveNewsEnableSelector } from 'common/selectors/webLive';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import { ContainerType } from 'common/types/container';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { isUserNotCoppaCompliant, shouldSkipCoppaCheck } from 'common/utils/ageGate';
import { isSeriesId } from 'common/utils/dataFormatter';
import { setWebEspanolModeStatusInCookie } from 'common/utils/espanolModeTools';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';
import hardRedirect from 'common/utils/redirect';
import { encodeDeeplinkString } from 'common/utils/seo';
import { trackLogging } from 'common/utils/track';
import { buildDeeplinkBaseUrl, getContainerUrl, getHomeURIForContentMode, getLoginRedirect, getUrl, getUrlByVideo } from 'common/utils/urlConstruction';
import { trimStartSlash, trimTrailingSlash, removeLocalePrefix } from 'common/utils/urlManipulation';
import { isOTTLiveNewsUrl, matchesRoute } from 'common/utils/urlPredicates';
import { setKidsModeStatusInCookie } from 'common/utils/webKidsModeTools';
import type { LocaleOptionType } from 'i18n/constants';
import { LOCALE_URL_PREFIXES, LOCALE_OPTIONS } from 'i18n/constants';
import { parseLocale } from 'i18n/utils';
import type { RegistrationLinkStatus } from 'web/features/authentication/containers/RegistrationLink/RegistrationLink';

import logger, { throttledLogError } from './logging';
import { cmsToMatrixContainerMap } from '../constants/cms-matrix-containers';

type TubiStore = Store<StoreState> & { dispatch: TubiThunkDispatch };
type Callback = (...args: unknown[]) => void;

export type RouteFn = (
  store: TubiStore,
  nextState: NextState,
  replace: Replace,
  cb?: Callback,
) => void;

type LeaveRouteFn = (
  store: Store<StoreState>,
  prevState: NextState,
) => void;

type RedirectFn = (
  nextState: NextState,
  replace: Replace,
  cb?: Callback,
) => void;

export function callIfDefined(fn: (() => void) | undefined): void {
  return fn ? fn() : undefined;
}

function noLoginRequiredRedirect(nextState: NextState, replace: Replace) {
  const location = nextState.location;
  if (location && location.query && location.query.registration_uid) {
    return;
  }

  if (location && location.query && location.query.redirect) {
    replace({ pathname: location.query.redirect });
  } else {
    replace({ pathname: WEB_ROUTES.home });
  }
}

export const checkValidId = (req: express.Request | null, contentId: string) => {
  /*
   contentId should be a number except
   for `kidsmode` which is used for deeplinks.
   This covers 'Infinity' as well as other NaN
  */
  if (
    Number.isFinite(+contentId)
    || contentId === DEEPLINK_KIDSMODE_IDENTIFIER
  ) return true;
  const err = new Error(`invalid contentId: ${contentId}`);
  logger.warn(
    {
      error: err,
      referer: req
        ? req.get('Referer')
        : window && window.location.pathname,
    },
    'invalid content id for ott content playback',
  );
  return false;
};

export const loginRequired: RouteFn = (store, nextState, replace, cb) => {
  const { auth } = store.getState();
  const { location: { pathname, query } } = nextState;
  const loginRedirect = getLoginRedirect(pathname, query);
  if (!auth.loaded) {
    return store
      .dispatch(loadAuth(nextState.location))
      .then(() => {
        const {
          auth: { user },
        } = store.getState();
        if (!user) {
          // oops, not logged in, so can't be here!
          replace({ pathname: WEB_ROUTES.signIn, search: loginRedirect });
        }
        callIfDefined(cb);
      })
      .catch((err: Error) => {
        logger.error(err, 'Check auth fail');
      });
  }

  if (!auth.user) {
    // oops, not logged in, so can't be here!
    replace({ pathname: WEB_ROUTES.signIn, search: loginRedirect });
  }
  callIfDefined(cb);
};
// verify password reset token

export const verifyToken: RouteFn = (store, nextState, replace, cb) => {
  const { token } = nextState.params;
  const { pwdReset } = store.getState();
  if (!pwdReset.loaded) {
    return store
      .dispatch(verifyResetToken(token))
      .then(cb)
      .catch((error: Error) => {
        logger.warn({ error, token }, 'token is invalid');
        callIfDefined(cb);
      });
  }
  callIfDefined(cb);
};

export const noLoginRequired: RouteFn = (store, nextState, replace) => {
  const { auth } = store.getState();
  if (auth.user) {
    noLoginRequiredRedirect(nextState, replace);
  }
};

export const noLoginRequiredWeb: RouteFn = (store, nextState, replace, cb) => {
  const { auth } = store.getState();
  if (auth.user) {
    noLoginRequiredRedirect(nextState, replace);
    callIfDefined(cb);
  }
};

export const noLockedInKidsMode: RouteFn = (store, nextState, replace) => {
  if (isUserNotCoppaCompliant()) {
    replace(WEB_ROUTES.home);
  }
};

export const androidPlaybackOnEnterHook = (req: express.Request, nextState: NextState, replace: Replace) => {
  const contentId = nextState.params.id;
  // contentId must be a number
  if (!checkValidId(req, contentId)) {
    replace(WEB_ROUTES.home);
    return;
  }

  if (__OTTPLATFORM__ !== 'FIRETV_HYB') return;

  /*
  Redirect to home with utm_campaign attribution
  when the contentId is kidsmode. This is to
  support kidsmode deeplinks on firetv.
  */
  if (contentId === DEEPLINK_KIDSMODE_IDENTIFIER) {
    replace({ pathname: '/', search: `?utm_campaign=${DEEPLINK_KIDSMODE_IDENTIFIER}` });
    return;
  }

  let search = '';
  if (__SERVER__) {
    search = `?${queryStringify(req.query as Record<string, string>)}`;
  } else {
    search = nextState.location.search;
  }

  replace({ pathname: `/ott/player/${contentId}`, search });
};

/**
 * redirect old style containers (/category?id=12323) to new style.
 * TODO(marios): grab the title and put it in the url
 */
export const redirectContainer: RedirectFn = (nextState, replace) => {
  const containerId = nextState.location.query.id;
  if (containerId) {
    replace({ pathname: `/category/${containerId}` });
  } else {
    // if you didn't pass an keyword, we don't know where to take you
    replace({ pathname: '/404' });
  }
};
// todo(liam) handle this better. tell user to log in to access special container
// currently used for queue and continue_watching
/**
 * first, translate existing ID to matrix ID, e.g. 1611 => 'featured'
 * then, ensure user is logged in if id is 'queue' or 'continue_watching'
 */
export const containerOnEnterHandler: RouteFn = (store, nextState, replace) => {
  const containerId = (nextState.location.pathname || '')
    .substring(1)
    .split('/')[1];

  // replace old container id
  const container = cmsToMatrixContainerMap[containerId];

  const { auth } = store.getState();
  // non-logged-in users can't access queue/continue_watching container
  if (
    !auth.user
    && [HISTORY_CONTAINER_ID, HISTORY_CONTAINER_LEAVING_SOON_ID, QUEUE_CONTAINER_ID, QUEUE_CONTAINER_LEAVING_SOON_ID].indexOf(containerId) !== -1
  ) {
    replace({ pathname: `/login?redirect=${encodeURIComponent(nextState.location.pathname)}` });
    return;
  }

  // 2nd check is to confirm the key !== val, which would result in endless loop
  if (container && containerId !== container) {
    replace({ pathname: `/category/${container}` });
  }
};

export const redirectSearch: RouteFn = (store, nextState, replace) => {
  const state = store.getState();
  const isMajorEventFailsafe = isMajorEventFailsafeActiveSelector(state);
  if (isMajorEventFailsafe) {
    replace({ pathname: WEB_ROUTES.failsafeFallback, query: { from: WEB_ROUTES.search } });
    return;
  }

  const { v } = nextState.location.query;
  if (v) {
    replace({ pathname: `${WEB_ROUTES.search}/${v}` });
  } else {
    // if no search query then we redirect to /home
    replace({ pathname: WEB_ROUTES.home });
  }
};

export const redirectIfMajorEventFailsafeActive: RouteFn = (store, nextState, replace) => {
  const state = store.getState();
  const isMajorEventFailsafe = isMajorEventFailsafeActiveSelector(state);
  if (isMajorEventFailsafe) {
    if (__ISOTT__) {
      replace({ pathname: OTT_ROUTES.home });
    } else {
      replace({ pathname: WEB_ROUTES.failsafeFallback, query: { from: WEB_ROUTES.search } });
    }
  }
};

export const landingRedirect: RouteFn = (store, nextState, replace) => {
  const state = store.getState();
  const isUSCountry = isUsCountrySelector(state);

  if (!isUSCountry) {
    replace(WEB_ROUTES.home);
  }
};

export const redirectToCorrectVideoPageOnEnter: RouteFn = (
  store,
  nextState,
  replace,
  cb,
) => {
  const state = store.getState();
  const { id: contentId } = nextState.params;

  // we need the content_type of the contentId to build the old url
  const {
    video: { byId },
  } = state;

  const video = byId[contentId];
  // if we already have the video in the store
  if (video && video.id) {
    replace(getUrlByVideo({ video }));
    callIfDefined(cb);
    return;
  }

  // fetch if we don't have it
  return store.dispatch(loadVideoById(contentId))
    .then(() => {
      const updatedState = store.getState();
      const videoObject = updatedState.video.byId[contentId];
      replace(getUrlByVideo({ video: videoObject }));
      callIfDefined(cb);
    })
    .catch(() => {
      // if anything went wrong, just go to the home page
      replace(WEB_ROUTES.home);
      callIfDefined(cb);
    });
};

/**
 * Movies and TV Shows page cannot be enabled
 * - when kids mode is ON.
 * - when country is not US
 * So replace these pages with homepage when the above conditions are met
 * @param {*} store
 * @param {*} nextState
 * @param {*} replace
 */
export const moviesTVShowsOnEnterHook: RouteFn = (store, nextState, replace) => {
  const state = store.getState();
  const {
    ui: { isKidsModeEnabled, twoDigitCountryCode },
  } = state;
  const isOttMovieTVFiltersDisabled = __ISOTT__ && !isFeatureAvailableInCountry('movieTVFilters', twoDigitCountryCode);
  const isWebMovieAndTVShowNavDisabled = __WEBPLATFORM__ && !isFeatureAvailableInCountry('webMovieAndTVShowNav', twoDigitCountryCode);
  if (
    isKidsModeEnabled
    || isOttMovieTVFiltersDisabled
    || isWebMovieAndTVShowNavDisabled
  ) {
    replace({ pathname: '/' });
  }
};

export const liveOnEnterHook: RouteFn = (store, nextState, replace) => {
  if (!shouldShowOTTLinearContentSelector(store.getState())) {
    replace({ pathname: '/' });
  }
};

export const livePlayerOnEnterHook: RouteFn = (store, nextState, replace) => {
  const state = store.getState();
  const { id: contentId } = nextState.params;
  const {
    video: { byId },
  } = state;
  // For purple carpet, we don't want to block it
  if (byId[contentId] && isPurpleCarpetContent(byId[contentId])) {
    return;
  }
  if (!shouldShowOTTLinearContentSelector(store.getState())) {
    store.dispatch(setEPGActiveContent({
      id: '',
    }));
    replace({ pathname: '/' });
  }
};

export const espanolModeOnEnterHook: RouteFn = (store, nextState, replace) => {
  if (!isSupportEspanolModeSelector(store.getState())) {
    replace({ pathname: '/' });
  }
};

export const webLiveNewsOnEnterHook: RouteFn = (store, nextState, replace) => {
  const state = store.getState();
  const { id: contentId } = nextState.params;
  const {
    video: { byId },
  } = state;
  // For purple carpet, we don't want to block it
  if (byId[contentId] && isPurpleCarpetContent(byId[contentId])) {
    return;
  }

  const isWebLiveNewsEnable = isWebLiveNewsEnableSelector(store.getState());
  if (!isWebLiveNewsEnable) {
    replace({ pathname: '/' });
  }
};

export const chainHooks = (...hooks: RouteFn[]) => (...args: Parameters<RouteFn>) => {
  const _replace = args[2];

  let replaceHasBeenCalled = false;
  const replace = (...replaceArgs: Parameters<Replace>) => {
    replaceHasBeenCalled = true;
    return _replace(...replaceArgs);
  };

  args[2] = replace as Replace;

  return hooks.forEach((hook) => {
    if (!replaceHasBeenCalled) {
      hook(...args);
    }
  });
};

export const chainHooksAsync = (...hooks: RouteFn[]) =>
  async (store: TubiStore, nextState: NextState, _replace: Replace, cb?: Callback) => {
    try {
      let replaceHasBeenCalled = false;
      const replace = (...replaceArgs: Parameters<Replace>) => {
        replaceHasBeenCalled = true;
        return _replace(...replaceArgs);
      };

      for (const hook of hooks) {
        if (!replaceHasBeenCalled) {
          // call each hook in series, excluding the cb parameter
          // eslint-disable-next-line no-await-in-loop
          await hook(store, nextState, replace as Replace);
        }
      }
      cb?.();
    } catch (err) {
      /* istanbul ignore else */
      if (err.message !== ROUTING_BLOCKED) {
        logger.error(err, 'Error in chainHooksAsync');
      }
      cb?.(err);
    }
  };

export const checkCoppa: RouteFn = (store, nextState, replace, cb) => {
  const isCoppaEnabled = isCoppaEnabledSelector(store.getState());
  const pathname = nextState.location.pathname;
  const isPageAgeGated = !shouldSkipCoppaCheck(pathname);

  // we need save the cookie for new user to run experiment
  if (__CLIENT__) {
    const firstSeen = Cookie.load('firstSeen');
    const hasNotSetValidUserCookie = !Cookie.load(IS_VALID_USER_FOR_PERSONALIZATION);
    if (isSameDay(new Date(firstSeen), new Date()) && hasNotSetValidUserCookie) {
      const { dispatch } = store;
      dispatch(persistIsValidUserForPersonalization(true));
    }
  }

  /* istanbul ignore else */
  if (isCoppaEnabled) {
    /* if user doesn't have coppaState or coppa cookie, or is trying to activate w/o age...show age gate modal */
    const state = store.getState();
    const isLoggedIn = isLoggedInSelector(state);
    const needAgeGate = isAgeGateRequiredSelector(state);

    if ((isPageAgeGated || (pathname === WEB_ROUTES.activate && isLoggedIn)) && needAgeGate) {
      store.dispatch(toggleAgeGateModal({ isVisible: true }));
    }

    /* if user failed coppa check, set kids mode lock */
    if (isUserNotCoppaCompliantSelector(state)) {
      store.dispatch(setKidsMode(true));
      if (!isPageAgeGated && pathname !== WEB_ROUTES.landing) {
        replace(WEB_ROUTES.home);
      }
    }
  }
  callIfDefined(cb);
};

export const checkPreferredLocale: RouteFn = (store, nextState, replace) => {
  const { location, params } = nextState;
  const state = store.getState();
  const { ui: { twoDigitCountryCode } } = state;

  // 1. check params in pattern like /(:locale/)home
  let locale = params.locale as LocaleOptionType;
  // 2. check if locale url matches landing page, such as `tubitv.com/es-us`
  const path = trimStartSlash(location.pathname) as LocaleOptionType;
  if (!locale && LOCALE_URL_PREFIXES.includes(path)) {
    locale = path;
  }
  // 3. set a preferred locale for MX users by default.
  //    when we need to add support for more locales, add a mapping of [countryCode: locale] here.
  if (!locale && twoDigitCountryCode === 'MX') {
    locale = LOCALE_OPTIONS.ES_MX;
  }

  if (LOCALE_URL_PREFIXES.includes(locale)) {
    store.dispatch(setPreferredLocale(locale));
    /**
     * when users request a URL with a prefix that doesn't match the country of ip
     * check a locale with the preferred language
     * e.g. users in US visit /es-mx/home, stay in /es-mx/home, but render as /es-us
     *      users in MX visit /es-us, stay in /es-us, but render as /es-mx
     * ref: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites#let-the-user-switch-the-page-language
     * if the preferred language locale doesn't exist, redirect to default routes
     * e.g. users in CA visit /es-mx/home or /es-us/home, redirect to /home
     */
    const [preferredLanguage, preferredCountry] = parseLocale(locale) || [];
    if (preferredCountry && twoDigitCountryCode && preferredCountry !== twoDigitCountryCode) {
      const fallback = `${preferredLanguage}-${twoDigitCountryCode.toLowerCase()}` as LocaleOptionType;
      if (!LOCALE_URL_PREFIXES.includes(fallback)) {
        return replace({
          ...location,
          pathname: removeLocalePrefix(location.pathname),
        });
      }
    }
    /**
     * if we have urls with locale prefix, set it as the preferred
     * e.g. users in MX visit /, redirect to /es-mx
     *      users in MX visit /home, redirect to /es-mx/home
     */
    if (twoDigitCountryCode && twoDigitCountryCode === 'MX' && LOCALIZED_WEB_ROUTES.includes(location.pathname)) {
      return replace({
        ...location,
        pathname: trimTrailingSlash(`/${locale}${location.pathname}`),
      });
    }
  }
};

export const disasterModeHook: RouteFn = (store, nextState, replace) => {
  if ((__ISOTT__ && __CLIENT__) || (__WEBPLATFORM__ && (__IS_FAILSAFE__ ? __CLIENT__ : __SERVER__))) {
    const isDisasterMode = shouldEnableDisasterMode(store.getState());
    const { location: { pathname } } = nextState;
    const disasterModeRoute = __ISOTT__ ? OTT_ROUTES.disasterMode : WEB_ROUTES.disasterMode;
    const liveNewsCheck = __ISOTT__ ? isOTTLiveNewsUrl(pathname) : matchesRoute(WEB_ROUTES.liveDetail, pathname);

    if (isDisasterMode && pathname !== disasterModeRoute && !liveNewsCheck) {
      replace(disasterModeRoute);
    }
  }
};

export const webAppEnterHook = chainHooks(
  disasterModeHook,
  checkPreferredLocale,
  checkCoppa
);

let consentByFeatureSwitchManager = false;

export const ottConsentHook: RouteFn = (store, nextState, replace) => {
  // We want to merge the GDPR code first without enable it on production since it is not ready yet
  // @todo: remove this after the GDPR is ready
  /* istanbul ignore next */
  if (!__PRODUCTION__) {
    if (__SERVER__) {
      return;
    }
    const { location: { pathname, search } } = nextState;
    const { consent: { consentRequired } } = store.getState();

    /* istanbul ignore next */
    if (FeatureSwitchManager.isEnabled(['GDPR', 'initial']) && !OTT_CONSENT_PAGE.includes(pathname) && !consentByFeatureSwitchManager) {
      consentByFeatureSwitchManager = true;
      replace(`${OTT_ROUTES.consentInitial}?${CONSENT_REDIRECT_FROM_QUERY_PARAM}=${pathname}${search}`);
      return;
    }

    let needConsent = true;
    OTT_CONSENT_BLACKLIST_ROUTES.forEach(item => {
      if (pathname.startsWith(item)) {
        needConsent = false;
      }
    });

    if (!needConsent) {
      return;
    }

    if (consentRequired) {
      replace(`${OTT_ROUTES.consentInitial}?${CONSENT_REDIRECT_FROM_QUERY_PARAM}=${pathname}${search}`);
    }
  }
};

/* istanbul ignore next */
export const ottAppEnterHook: RouteFn = (...args) => {
  disasterModeHook(...args);
  ottConsentHook(...args);
  featureEducationHook(...args);
};

export const featureEducationHook: RouteFn = (store: Store<StoreState>, nextState: NextState) => {
  // The educated state is kept as a four digits binary number. Check constants/constants for more info.
  /* eslint-disable no-bitwise */
  if (__SERVER__) {
    return;
  }
  const state = store.getState();

  if (__OTTPLATFORM__ !== 'TIZEN' && isUsCountrySelector(state)) {
    return;
  }

  const {
    ottUI: {
      featureEducation: { educated },
    },
  } = state;
  const { location } = nextState;

  let featuresEducated = educated;
  // restore store state from local data, it will only be called once in an app session
  if (featuresEducated === undefined) {
    featuresEducated = parseInt(getLocalData(LD_FEATURE_EDUCATED), 10);
    if (!featuresEducated || featuresEducated < NON_FEATURES_EDUCATED || featuresEducated > ALL_FEATURES_EDUCATED) {
      featuresEducated = NON_FEATURES_EDUCATED;
    }
    store.dispatch(setFeaturesEducated(featuresEducated));
  }

  let nextFeaturesEducated = featuresEducated;

  const activeContentMode = currentContentModeSelector(state, { pathname: location.pathname });

  if (activeContentMode === CONTENT_MODES.linear || location.pathname.startsWith(OTT_LIVE_PLAYER_ROUTE_PREFIX)) {
    nextFeaturesEducated = featuresEducated | FEATURE_TO_EDUCATE.LiveTV;
  }

  if (nextFeaturesEducated !== featuresEducated) {
    featuresEducated = nextFeaturesEducated;
    store.dispatch(setFeaturesEducated(nextFeaturesEducated));
  }
  /* eslint-enable no-bitwise */
};

export const ottHomeOnEnterHook: RouteFn = (store, nextState, replace) => {
  const state = store.getState();
  const { ui: { isKidsModeEnabled } } = state;
  const { pathname } = nextState.location;

  if (isKidsModeEnabled) return;

  if (__CLIENT__) {
    const isUserQualifiedForPersonalization = isUserQualifiedForPersonalizationExperiment(state);
    const isFromLoginPage = (
      [
        OTT_ROUTES.activate,
        OTT_ROUTES.ageGate,
        OTT_ROUTES.genderGate,
        OTT_ROUTES.signInWithMagicLink,
        OTT_ROUTES.amazonSSO,
      ] as unknown as string
    ).includes(pathname);

    if (isFromLoginPage && isUserQualifiedForPersonalization) {
      const shouldRedirect = shouldShowTitlePersonalizationPrompt(state);
      OttFireTVTitleOnboardingPersonalization(store).logExposure();
      Cookie.remove(PERSONALIZATION_PROMPT_FOR_NEW_USERS_WITHIN_7_DAYS, { path: '/' });
      if (shouldRedirect) {
        replace(OTT_ROUTES.personalizationTitle);
      }
    }
  }

  const isEPGEnabled = shouldShowOTTLinearContentSelector(state);
  // For Home page, we're not using EPG status, so we need to reset the EPG state
  // @todo(zhuo): a better way to do this
  // When in the experiment,
  // do not reset the EPG state when returning from live player

  if (isEPGEnabled && pathname !== OTT_ROUTES.liveMode) {
    store.dispatch(resetEPGActiveContent());
  }
};

export const containerDetailOnLeaveHook: LeaveRouteFn = (store) => {
  const { getState, dispatch } = store;
  const {
    ui: {
      deeplinkBackOverrides,
    },
  } = getState();
  const isDeeplinked = !!deeplinkBackOverrides[BACK_FROM_CONTAINER_TO_HOME];

  if (isDeeplinked && matchesRoute(OTT_ROUTES.home, tubiHistory.getCurrentLocation().pathname)) {
    dispatch(actionWrapper(SET_DEEPLINK_BACK_OVERRIDE, { data: { [BACK_FROM_CONTAINER_TO_HOME]: false } }));
    // reset the active container ID in the container list page and the active content ID in container detail page
    dispatch(clearContainerGridIDs());
  }
};

/**
 * Redirect the removed 'channels' routes to the correct 'networks' routes.
 * WEB_ROUTES.channel externally to users they are 'networks'
 */
export const channelOnEnterHook: RouteFn = (store, nextState, replace) => {
  replace({ pathname: `${WEB_ROUTES.channel}/${nextState.params.id}` });
};

export const deeplinkOnEnterHook: RouteFn = (store, nextState, replace, cb) => {
  /* istanbul ignore else */
  if (__IS_COMCAST_PLATFORM_FAMILY__) {
    handleComcastDeepLinkHook(store, nextState, replace);
    callIfDefined(cb);
  } else if (__OTTPLATFORM__ === 'LGTV') {
    handleLGTVDeeplinkHook(store, nextState, replace, cb);
  }
};

interface LGTVLaunchParams {
  contentTarget: string;
}

export const handleLGTVDeeplinkHook: RouteFn = async (store, nextState, replace, cb) => {
  try {
    const { location: { query } } = nextState;
    const lgLaunchParams = JSON.parse(query[LGTV_DEEPLINK_PARAM_NAME] as string) as LGTVLaunchParams;

    /* istanbul ignore next */
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'lgtv_launchparams',
      message: {
        params: query[LGTV_DEEPLINK_PARAM_NAME],
      },
    });

    const contentTargetParam: string = lgLaunchParams[LGTV_DEEPLINK_CONTENT_TARGET_NAME];

    if (!contentTargetParam) {
      throw new Error('contentTarget is empty');
    }

    // default utm values
    let deeplinkQuery: Record<string, string> = {
      utm_source: 'undefined',
      utm_campaign: `${__OTTPLATFORM__.toLowerCase()}-general`,
      utm_medium: 'partnership',
    };

    const contentObjParsed: Record<string, any> = parseQueryString(contentTargetParam);

    const { page, ...contentObj } = contentObjParsed;

    let contentId = '';

    if (!isNaN(Number(contentTargetParam))) {
      contentId = String(contentTargetParam);
    } else {
      contentId = contentObj[LGTV_DEEPLINK_CONTENT_ID_NAME];
      if (contentId) {
        contentId = String(contentId);
        delete contentObj[LGTV_DEEPLINK_CONTENT_ID_NAME];
      }
      deeplinkQuery = {
        ...deeplinkQuery,
        ...contentObj,
      };
    }

    // handle redirecting to specific route if `page` parameter exists
    if (page) {
      // default to home
      let deeplinkTargetUrl = addQueryStringToUrl(OTT_ROUTES.home, deeplinkQuery);
      switch (page) {
        case LG_DEEPLINK_PAGES.SERIES: {
          if (!contentId) {
            throw new Error(`contentId is empty & page param is ${LG_DEEPLINK_PAGES.SERIES}`);
          }
          const baseUrl = getUrl({
            id: contentId,
            type: SERIES_CONTENT_TYPE,
          });
          deeplinkTargetUrl = addQueryStringToUrl(baseUrl, deeplinkQuery);
          break;
        }
        case LG_DEEPLINK_PAGES.CONTAINER: {
          if (!contentId) {
            throw new Error(`contentId is empty & page param is ${LG_DEEPLINK_PAGES.CONTAINER}`);
          }
          const baseUrl = getContainerUrl(contentId, {
            ott: true,
          });
          deeplinkTargetUrl = addQueryStringToUrl(baseUrl, deeplinkQuery);
          break;
        }
        case LG_DEEPLINK_PAGES.LIVE: {
          if (!contentId) {
            throw new Error(`contentId is empty & page param is ${LG_DEEPLINK_PAGES.LIVE}`);
          }
          const baseUrl = getUrl({
            id: contentId,
            type: LINEAR_CONTENT_TYPE,
          });
          deeplinkTargetUrl = addQueryStringToUrl(baseUrl, deeplinkQuery);
          break;
        }
        case LG_DEEPLINK_PAGES.SEARCH: {
          if (!contentId) {
            throw new Error(`contentId is empty & page param is ${LG_DEEPLINK_PAGES.SEARCH}`);
          }
          const baseUrl = OTT_ROUTES.search;
          deeplinkQuery.q = contentId;
          deeplinkTargetUrl = addQueryStringToUrl(baseUrl, deeplinkQuery);
          break;
        }
        case LG_DEEPLINK_PAGES.CONTENT: {
          if (!contentId) {
            throw new Error(`contentId is empty & page param is ${LG_DEEPLINK_PAGES.CONTENT}`);
          }
          // values for contentId can be movie, tv, linear, latino
          const baseUrl = getHomeURIForContentMode(contentId as string as CONTENT_MODE_VALUE);
          if (!baseUrl) {
            throw new Error(`contentId does not match: ${contentId} page param is ${LG_DEEPLINK_PAGES.CONTENT}`);
          }
          deeplinkTargetUrl = addQueryStringToUrl(baseUrl, deeplinkQuery);
          break;
        }
        case LG_DEEPLINK_PAGES.HOME:
          // default for `deeplinkTargetUrl` is home
          break;
        default:
          throw new Error(`no match for page param ${page}`);
      }

      replace(deeplinkTargetUrl);
      callIfDefined(cb);
      return;
    }
    // The following code handles redirecting to VOD player or Series page

    // if there is no content ID and no page param, throw error and redirect to home
    if (!contentId) {
      throw new Error('contentId is empty & page param is empty');
    }

    if (isSeriesId(contentId)) {
      try {
        const result = await getFirstEpisodeContentIdIfSeriesId(`${contentId}`, store.dispatch, store.getState);
        contentId = result.contentId;
      } catch (error) {
        logger.error(`LGTV DEEPLINK ERROR failed to get first episode of series ID ${contentId}`);
        replace(getUrl({ id: contentId.slice(1), type: SERIES_CONTENT_TYPE }));
        callIfDefined(cb);
      }
    }

    const baseUrl = buildDeeplinkBaseUrl(contentId);
    const deeplinkTargetUrl = addQueryStringToUrl(baseUrl, deeplinkQuery);

    replace(deeplinkTargetUrl);
    callIfDefined(cb);
  } catch (error) {
    logger.error(error, 'LGTV DEEPLINK ERROR');
    replace(OTT_ROUTES.home);
    callIfDefined(cb);
  }
};

const handleComcastDeepLinkHook: RouteFn = (store, nextState, replace) => {
  const { location: { pathname, query } } = nextState;
  const {
    [ottDeeplinkRequiredParameter.LaunchPoint]: launchpoint,
    [ottDeeplinkRequiredParameter.LaunchedFrom]: launchedFrom,
    [ottDeeplinkRequiredParameter.Detail]: entityId,
    [ottDeeplinkRequiredParameter.Playback]: assetId,
    [ottDeeplinkRequiredParameter.PlaybackAssetType]: assetType,
    [ottDeeplinkRequiredParameter.Search]: searchKey,
    [ottDeeplinkRequiredParameter.Section]: sectionName,
  } = query;
  const deeplinkQuery: Record<string, string> = {
    utm_source: launchedFrom || 'search',
    utm_campaign: `${__OTTPLATFORM__.toLowerCase()}-general`,
    utm_medium: 'partnership',
  };

  // handle empty launchpoint
  let defaultLaunchPoint;
  if (entityId) {
    defaultLaunchPoint = ottDeeplinkLaunchPoint.Detail;
  } else if (assetId) {
    defaultLaunchPoint = ottDeeplinkLaunchPoint.Playback;
  } else if (searchKey) {
    defaultLaunchPoint = ottDeeplinkLaunchPoint.Search;
  } else if (sectionName) {
    defaultLaunchPoint = ottDeeplinkLaunchPoint.Section;
  }

  let baseUrl: string = OTT_ROUTES.home;
  switch (launchpoint || defaultLaunchPoint) {
    case ottDeeplinkLaunchPoint.Home:
    case ottDeeplinkLaunchPoint.Launch:
      baseUrl = OTT_ROUTES.home;
      break;
    case ottDeeplinkLaunchPoint.Detail:
      if (entityId) {
        baseUrl = buildDeeplinkBaseUrl(entityId, assetType, ottDeeplinkLaunchPoint.Detail);
        if (assetId && assetId !== entityId) {
          logger.warn({ launchpoint, assetId, assetType, entityId, pathname }, 'Warning when deeplinking to detail page because the entityId is different from the assetId');
        }
        break;
      }
      logger.error({ launchpoint, pathname }, 'Error when deeplinking to detail page because of empty entityId');
      break;
    case ottDeeplinkLaunchPoint.Playback:
      if (assetId) {
        baseUrl = buildDeeplinkBaseUrl(assetId, assetType) || baseUrl;
        if (entityId && assetId !== entityId) {
          logger.warn({ launchpoint, assetId, assetType, entityId, pathname }, 'Warning when deeplinking to playback page because the entityId is different from the assetId');
        }
        break;
      }
      logger.error({ launchpoint, pathname }, 'Error when deeplinking to playback page because of empty assetId');
      break;
    case ottDeeplinkLaunchPoint.Search:
      baseUrl = OTT_ROUTES.search;
      if (searchKey) {
        deeplinkQuery.searchKey = encodeDeeplinkString(searchKey, { launchPoint: ottDeeplinkLaunchPoint.Search });
        break;
      }
      logger.error({ launchpoint, pathname }, 'Error when deeplinking to search page because of empty query');
      break;
    case ottDeeplinkLaunchPoint.Section:
      if (sectionName) {
        baseUrl = getContainerUrl(
          encodeDeeplinkString(sectionName, { launchPoint: ottDeeplinkLaunchPoint.Section }),
          { type: ContainerType.regular, ott: true }
        );
        break;
      }
      logger.error({ launchpoint, pathname }, 'Error when deeplinking to category page because of empty sectionName');
      break;
    default:
      // Skip reporting the blank deeplink parameters case for now since it just makes for meaningless, noisy alarms.
      // NB: `launchedFrom` is deliberately excluded because that is the one field that _does_ appear to be populated.
      if ([launchpoint, entityId, assetId, searchKey, sectionName].filter(Boolean).length > 0) {
        throttledLogError({ launchpoint, pathname }, 'Error when deeplinking because of unsupported launchpoint');
      }
      replace(baseUrl);
      return;
  }

  const deeplinkTargetUrl = addQueryStringToUrl(baseUrl, deeplinkQuery);
  replace(deeplinkTargetUrl);
};

export const checkMagicLinkStatusHook: RouteFn = (store, nextState, replace) => {
  const { status } = nextState.params;
  if (!Object.values<string>(MAGIC_LINK_STATUS).includes(status)) {
    replace(WEB_ROUTES.notFound);
  }
};

export const checkRegistrationLinkStatusHook: RouteFn = (store, nextState, replace) => {
  const status = nextState.params.status as RegistrationLinkStatus;
  if (status !== 'failed' && status !== 'expired') {
    replace(WEB_ROUTES.notFound);
  }
};

export const requireQueryEmailHook: RouteFn = (store, nextState, replace) => {
  const email = nextState.location?.query?.email || '';
  if (!REGEX_EMAIL_VALIDATION.test(email)) {
    replace(WEB_ROUTES.signIn);
  }
};

export const onboardingOnEnterHook: RouteFn = (store) => {
  if (__CLIENT__) {
    const { dispatch } = store;
    dispatch(setIsFirstSession(true));
    if (__OTTPLATFORM__ === 'FIRETV_HYB') {
      Cookie.save(PERSONALIZATION_PROMPT_FOR_NEW_USERS_WITHIN_7_DAYS, 'true', {
        maxAge: days(7) / secs(1),
        path: '/',
      });
    }
  }
};

export const webContainersOnEnterHook: RouteFn = (store, nextState, replace) => {
  const isWebAllCategoriesEnabled = webAllCategoriesExperimentSelector(store.getState());
  // we can't log exposure for any experiment on hook, cause it will be called on server side
  // we can save it to cookie and then send the log on client side
  /* istanbul ignore else */
  if (__SERVER__) {
    Cookie.save(FIRST_LOAD_PAGE_IS_CATEGORIES_ON_WEB, 'true', {
      maxAge: mins(10),
      path: '/',
    });
  }
  if (!isWebAllCategoriesEnabled) {
    replace({ pathname: WEB_ROUTES.home });
  }
};

export const webMyStuffOnEnterHook: RouteFn = (store, nextState, replace) => {
  const state = store.getState();
  const { ui: { twoDigitCountryCode } } = state;
  const isMajorEventFailsafe = isMajorEventFailsafeActiveSelector(state);
  const isFeatureAvailable = !isMajorEventFailsafe && isFeatureAvailableInCountry('webMyStuff', twoDigitCountryCode);
  const isLoggedIn = isLoggedInSelector(state);

  if (isMajorEventFailsafe) {
    replace({ pathname: WEB_ROUTES.failsafeFallback, query: { from: nextState.location.pathname } });
    return;
  }

  if (!isFeatureAvailable) {
    replace({ pathname: WEB_ROUTES.home });
  } else if (isFeatureAvailable && !isLoggedIn) {
    replace({ pathname: WEB_ROUTES.signIn, search: getLoginRedirect(WEB_ROUTES.myStuff, {}) });
  }
};

export const privacyCenterOnEnterHook: RouteFn = (store, nextState, replace) => {
  const state = store.getState();
  const isGDPREnabled = isGDPREnabledSelector(state);
  /* istanbul ignore else */
  if (!isGDPREnabled) {
    replace({ pathname: WEB_ROUTES.home });
    return;
  }
  const isLoggedIn = isLoggedInSelector(store.getState());
  const pathname = nextState.location.pathname;
  if (isLoggedIn && pathname !== WEB_ROUTES.accountPrivacyCenter) {
    replace({ pathname: WEB_ROUTES.accountPrivacyCenter });
  }
  if (!isLoggedIn && pathname !== WEB_ROUTES.guestPrivacyCenter) {
    replace({ pathname: WEB_ROUTES.guestPrivacyCenter });
  }
};

export const superbowlOnEnterHook: RouteFn = (store, nextState, replace) => {
  const country = store.getState().ui.twoDigitCountryCode;
  if (country !== 'US') {
    replace({ pathname: WEB_ROUTES.home });
  }
};

export const disasterModeOnEnterHook: RouteFn = (store, _, replace) => {
  const isDisasterMode = shouldEnableDisasterMode(store.getState());

  if (!isDisasterMode) {
    replace({ pathname: __ISOTT__ ? OTT_ROUTES.home : WEB_ROUTES.home });
  }
};

export const privacyCenterRedirectHook: RouteFn = (store, nextState, replace) => {
  const isLoggedIn = isLoggedInSelector(store.getState());
  replace({ pathname: isLoggedIn ? WEB_ROUTES.accountPrivacyCenter : WEB_ROUTES.guestPrivacyCenter });
};

export const ageUnavailableRedirectHook: RouteFn = (store) => {
  const { userLanguageLocale } = store.getState().ui;
  hardRedirect(`/static/web451_${userLanguageLocale}.html`);
};

export const redirectKids: RedirectFn = (nextState, replace) => {
  setKidsModeStatusInCookie(true);
  replace(WEB_ROUTES.home);
};

export const redirectEspanol: RedirectFn = (nextState, replace) => {
  setWebEspanolModeStatusInCookie(true);
  replace(WEB_ROUTES.home);
};

export const onLeaveVideoHook: LeaveRouteFn = (store) => {
  /**
   * Intended to disable fullscreen in the player when the user navigates
   * away from the video player page. It is possible to do this with keyboard
   * shortcuts when the player is in fullscreen mode and the browser chrome is
   * hidden. This is necessary because we don't want UI elements that check the
   * player's fullscreen status to think the player is fullscreened when it isn't
   * even rendered.
   */
  if (store.getState().ui.fullscreen) {
    store.dispatch(setFullscreen(false));
  }
};
