/* eslint "@typescript-eslint/no-floating-promises": "error" */ // TODO: we should enable this for the entire repo
import { parseQueryString } from '@adrise/utils/lib/queryString';
import { years } from '@adrise/utils/lib/time';
import uaParser from '@adrise/utils/lib/ua-parser';
import getDiff from 'deep-diff';
import type { History, Query } from 'history';
import jwtDecode from 'jwt-decode';
import Cookie from 'react-cookie';
import type { PlainRoute } from 'react-router';

import { palNonceManager } from 'client/features/playback/utils/palNonceManager';
import { setupRemoteDebugger } from 'client/remoteDebugger';
import diffLogger from 'client/setup/diffLogger';
import { ensureStorageIsAccessible } from 'client/setup/tasks/ensureStorageIsAccessible';
import { setupDeviceId } from 'client/setup/tasks/setupDeviceId';
import { initExperimentManager, setupExperimentManager } from 'client/setup/tasks/setupExperimentManager';
import { setupFailsafeI18n } from 'client/setup/tasks/setupFailsafeI18n';
import { setupFirstSeen } from 'client/setup/tasks/setupFirstSeen';
import { setupForceFailsafeExperiment } from 'client/setup/tasks/setupForceFailsafeExperiment';
import { setUpDeviceLanguage, setupIntroVideo } from 'client/setup/tasks/setupIntroVideo';
import { setupRedirectExperiment } from 'client/setup/tasks/setupRedirectExperiment';
import { createSnapshot } from 'client/snapshot';
import type LGTVSystemApi from 'client/systemApi/lgtv';
import type PS4SystemApi from 'client/systemApi/ps4';
import type BaseSystemApi from 'client/systemApi/systemApi';
import { getCookie } from 'client/utils/localDataStorage';
import { setContentMode } from 'common/actions/contentMode';
import { fetchUserAge } from 'common/actions/fetchUserAge';
import { setHybAppVersion } from 'common/actions/fire';
import { setDeviceDeal, setISD, setRSD } from 'common/actions/ottSystem';
import { loadRemoteConfig } from 'common/actions/remoteConfig';
import { setAnalyticsConfig } from 'common/actions/tracking';
import {
  setEspanolMode,
  setKidsMode,
  setSlowDeviceStatus,
  setTwoDigitCountryCode,
  setUserAgent,
} from 'common/actions/ui';
import { setDismissedPrompt, setIsValidUserForPersonalization } from 'common/actions/webUI';
import * as actionTypes from 'common/constants/action-types';
import { COOKIE_NATIVE_ANDROID_VERSION, SHOULD_FETCH_DATA_ON_SERVER } from 'common/constants/constants';
import {
  COOKIE_IS_ESPANOL_MODE_ENABLED,
  COOKIE_IS_KIDS_MODE_ENABLED, DISMISSED_PERSONALIZATION_PROMPT,
  IS_VALID_USER_FOR_PERSONALIZATION,
} from 'common/constants/cookies';
import type { CountryCode } from 'common/constants/geoFeatures';
import WebAnalyticsAnonymousToken from 'common/experiments/config/webAnalyticsAnonymousToken';
import { load as loadAuth } from 'common/features/authentication/actions/auth';
import {
  DEVICE_DEAL_PARAM,
  ISD_PARAM,
  RSD_PARAM,
  TUBI_VERSION_PARAM,
} from 'common/features/authentication/constants/persistedQueryParams';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { getPersistedQueryParams } from 'common/features/authentication/utils/persistedQueryParams';
import {
  isCoppaFetchUserAgeEnabledSelector,
  isUserNotCoppaCompliantSelector,
} from 'common/features/coppa/selectors/coppa';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import { initGlobalStateForOnetrust } from 'common/features/gdpr/utils';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import { ottPALIntegrationSelector } from 'common/selectors/experiments/ottPALIntegrationSelector';
import { isMajorEventFailsafeActiveSelector } from 'common/selectors/remoteConfig';
import { countryCodeSelector } from 'common/selectors/ui';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import type { StoreState, TubiStore } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { safeRequestIdleCallback } from 'common/utils/async';
import { isDeepLinkOnWeb } from 'common/utils/deeplinkType';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { isParentalRatingOlderKidsOrLess } from 'common/utils/ratings';
import { getContentModeFromPath } from 'common/utils/routePath';
import { clearAnonymousTokens, setDeviceIdForTokenRequests } from 'common/utils/token';
import { isKidsModeDeeplinkURL } from 'common/utils/urlPredicates';
import { convertNativeVersionStringToAppVersionObject } from 'common/utils/version';
import { SUPPORTED_COUNTRY } from 'i18n/constants';
import { initOneTrustForOTT } from 'ott/features/gdpr/onetrust';
import { deviceNotSupportPagePath, isDeviceSupportOnetrust } from 'ott/features/gdpr/utils/deviceSupport';
import { hideLoadingSpinner } from 'ott/utils/loadingSpinner';

import { collectDeviceSpecInfo } from './tasks/collectDeviceSpecInfo';
import { deeplinkKidsMode } from './tasks/deeplinkKidsMode';
import disableSentryDuringFailSafe from './tasks/disableSentryDuringFailSafe';
import { polyfillAbortController } from './tasks/polyfillAbortController';
import { polyfillIntersectionObserver } from './tasks/polyfillIntersectionObserver';
import { renderPage, setupDevHMR } from './tasks/renderPage';
import { setFeatureSwitchManagerOnSelectParams } from './tasks/setFeatureSwitchManagerOnSelectParams';
import { addAuthChangeListener, notifyAccountChange } from './tasks/setupAuthObserver';
import { setupCastAPI } from './tasks/setupCastAPI';
import { setupComcastDeeplink } from './tasks/setupComcastDeeplink';
import { setupConsentChangeListener } from './tasks/setupConsentChangeListener';
import { setupCoppa } from './tasks/setupCoppa';
import { setupFeatureSwitchManagerFromURI } from './tasks/setupFeatureSwitchManagerFromURI';
import { setupLongPress } from './tasks/setupLongPress';
import { setupOfflinePlugin } from './tasks/setupOfflinePlugin';
import { setupOttDeepLink } from './tasks/setupOttDeepLink';
import { setupOTTLandingPage } from './tasks/setupOTTLandingPage';
import { setupOTTRelaunchPage } from './tasks/setupOTTRelaunchPage';
import { setupPerformanceTracking } from './tasks/setupPerformanceTracking';
import { setupSamsungDeeplink } from './tasks/setupSamsungDeeplink';
import { setupSDKTracking } from './tasks/setupSDKTracking';
import { setupSuitest } from './tasks/setupSuitest';
import { setupSystemApi } from './tasks/setupSystemApi';
import { setupTransitionHooks } from './tasks/setupTransitionHooks';
import { setupTubiDebugBridge } from './tasks/setupTubiDebugBridge';
import { setupVizioLinkStatus } from './tasks/setupVizioLinkStatus';
import { setupXboxoneDeeplink } from './tasks/setupXboxoneDeeplink';
import syncLoginStatus from './tasks/syncLoginStatus';
import { checkTransferUser } from './tasks/transferUser';
import { initUserSession, syncUserSessionToLocalStorage, trackUserSessionLengthInDays } from './tasks/userSession';

interface DecodedUserToken {
  rating: number;
}

let systemApi: BaseSystemApi | undefined;

export const tasksBeforeRouteMatch = async (store: TubiStore, client: ApiClient) => {
  const { dispatch } = store;

  await Promise.all([
    setupFirstSeen(store),
    setupDeviceId(store),
  ]);

  setupIntroVideo(store);

  const promises: Promise<unknown>[] = [];

  if (__IS_FAILSAFE__) {
    await store.dispatch(loadRemoteConfig())
      .then(
        remoteConfig => {
          const featureSwitchCountry = FeatureSwitchManager.get('Country') as CountryCode;
          store.dispatch(setTwoDigitCountryCode(
            featureSwitchCountry in SUPPORTED_COUNTRY ? featureSwitchCountry : remoteConfig.country as CountryCode
          ));
          if (remoteConfig.isInBlockedCountry) {
            location.href = 'https://gdpr.tubi.tv/';
          }
        }
      )
      .catch(error => {
        logger.error(error, 'Failed to load remote config');
        store.dispatch(setTwoDigitCountryCode(undefined));
      });
  /* istanbul ignore next */
  } else {
    const { remoteConfig } = store.getState();
    window.__REMOTE_CONFIG__ = remoteConfig;
  }

  setupNS1PCode(countryCodeSelector(store.getState()));

  if (!SHOULD_FETCH_DATA_ON_SERVER) {
    const query = parseQueryString(window.location.search);
    // TODO: we can't get real ip on client side
    // And it only use for logging
    // We'll leave it for now
    // dispatch(authActions.setUserRealIP(req.ip));
    dispatch(actionWrapper(actionTypes.UPDATE_CURRENT_DATE));
    dispatch(setUserAgent(uaParser(navigator.userAgent)));

    if (__ISOTT__) {
      // must be dispatched after setUserAgent so that it would have access to userAgent.ua from state
      dispatch(setSlowDeviceStatus());
    }

    if (__WEBPLATFORM__) {
      if (isDeepLinkOnWeb(query as Query)) {
        Cookie.remove(COOKIE_IS_KIDS_MODE_ENABLED);
      } else {
        if (getCookie(COOKIE_IS_KIDS_MODE_ENABLED)) {
          dispatch(setKidsMode(true));
        } else if (getCookie(COOKIE_IS_ESPANOL_MODE_ENABLED)) {
          dispatch(setEspanolMode(true));
          Cookie.remove(COOKIE_IS_ESPANOL_MODE_ENABLED);
        }
        if (getCookie(IS_VALID_USER_FOR_PERSONALIZATION) === 'true') {
          dispatch(setIsValidUserForPersonalization(true));
        }
        if (getCookie(DISMISSED_PERSONALIZATION_PROMPT)) {
          dispatch(setDismissedPrompt(true));
        }
      }
      dispatch(setContentMode({ contentMode: getContentModeFromPath(getCurrentPathname()) }));

      // TODO: We can't support this on the client-side because we can't access
      // the request headers. As a result, during failsafe, the form these are
      // used for will not be prepopulated by headers sent from the user's
      // mobile device. If we want to support this going forward, we'll have to
      // use query params instead of headers.
      // dispatch(actionWrapper(actionTypes.SET_SUPPORT_MOBILE_METADATA_HEADERS, { mobileMetadataHeaders }));
    }

    if (__IS_HYB_APP__) {
      [
        {
          cookie: COOKIE_NATIVE_ANDROID_VERSION,
          query: 'x-android-native-version',
          action: (nativeVersion: string): TubiThunkAction =>
            setHybAppVersion(convertNativeVersionStringToAppVersionObject(nativeVersion)),
        },
      ].forEach(({ cookie, query: queryKey, action }) => {
        const value = query[queryKey] || Cookie.load(cookie);
        if (value) {
          Cookie.save(cookie, value, { maxAge: years(100) });
        }
        dispatch(action(value as string));
      });

      const persistedQueryParams = getPersistedQueryParams();
      [
        {
          param: DEVICE_DEAL_PARAM,
          query: 'device-deal',
          action: setDeviceDeal,
        },
        {
          param: ISD_PARAM,
          query: 'x-android-isd',
          action: setISD,
        },
        {
          param: RSD_PARAM,
          query: 'x-android-rsd',
          action: setRSD,
        },
      ].forEach(({ param, query: queryKey, action }) => {
        const value = query[queryKey] || persistedQueryParams[param] || Cookie.load(param);
        dispatch(action(value));
      });
    }

    /**
     * In the native side for PS4 we set the ServiceStartUri as
     * https://ott-ps4.tubitv.com/?tubi_version=1.07_1
     *
     * LGTV native app will set the url param `?tubi_version=1.1.0` for example
     */
    if (__OTTPLATFORM__ === 'PS4' || __OTTPLATFORM__ === 'LGTV' || __OTTPLATFORM__ === 'FIRETV_HYB') {
      const nativeVersion = query[TUBI_VERSION_PARAM] || getPersistedQueryParams()[TUBI_VERSION_PARAM];
      const hybAppVersion = convertNativeVersionStringToAppVersionObject(nativeVersion);
      dispatch(setHybAppVersion(hybAppVersion));
    }

    /**
     * OTT deeplink
     */
    setupOttDeepLink({ ...window.location, query }, dispatch);

    const isKidsModeDeeplinked = isKidsModeDeeplinkURL(query);
    const isUserNotCoppaCompliant = isUserNotCoppaCompliantSelector(store.getState());
    if (isKidsModeDeeplinked || isUserNotCoppaCompliant) {
      dispatch(setKidsMode(true));
    }

    // We only want kids mode set for OTT based on parental rating
    // and if it is not kidsmode deeplink
    if (__ISOTT__) {
      const state = store.getState();
      const {
        userSettings: { parentalRating },
      } = state;
      const shouldSetKidsMode = isKidsModeDeeplinked || isParentalRatingOlderKidsOrLess(parentalRating);
      dispatch(setKidsMode(shouldSetKidsMode));
    }
  }

  if (__IS_FAILSAFE__) {
    promises.push(setupFailsafeI18n(store, client));
  }

  // Exclude WDYR completely on slow platforms
  if (__DEVELOPMENT__ && !['PS4', 'LGTV', 'TIZEN'].includes(__OTTPLATFORM__)) {
    require('./wdyr'); // import WhyDidYouRender before any React components
  }
  ensureStorageIsAccessible();

  promises.push(
    setupExperimentManager(store, client)
  );

  // We need to wait for the device_language to be set in cookie before we can setup the i18n
  await setUpDeviceLanguage(store);
  await Promise.all(promises);
  // Need wait country and locale to be set
  if (!isDeviceSupportOnetrust(store.getState())) {
    const path = deviceNotSupportPagePath(store.getState().ui.userLanguageLocale);
    location.href = `/${path}`;
  }
  initExperimentManager(store); // must be after call to `setTwoDigitCountryCode`
  // OneTrust depends on `window.__REMOTE_CONFIG__ `, we need to init it after remote config been set
  initGlobalStateForOnetrust(store.getState());

  const currentLocation = tubiHistory.getCurrentLocation();
  const dispatchLoadAuth = () => store.dispatch(loadAuth(currentLocation));

  if (__ISOTT__) {
    await initUserSession(store);

    // initUserSession may update auth.user, so we should retrieve the state afterward.
    const state = store.getState();
    initOneTrustForOTT(state);

    // TODO: The condition can be removed once we decide to fully rely on the localStorage-based user session
    // from initUserSession. Additionally, bypassing the major event is to prevent intensive calls to
    // "loadAuth": https://app.shortcut.com/tubi/story/848031/ott-minimize-call-to-loadauth#activity-848347
    if (__IS_FAILSAFE__ && !isMajorEventFailsafeActiveSelector(state)) {
      await dispatchLoadAuth();
    }
  } else {
    // We need to load the user session for the web platforms. The reason and data flow diagram can
    // be referred to https://www.notion.so/tubi/User-Session-Management-13872557e92080cfb386df45fbea99e8?pvs=4#13872557e920805e9a26ebc436bb20d7
    await dispatchLoadAuth();
  }

  const state = store.getState();

  if (isLoggedInSelector(state)) {
    const { user } = state.auth;

    try {
      // User rating is needed for fetching homescreen
      const { rating } = jwtDecode<DecodedUserToken>(user?.token || '');
      dispatch(actionWrapper(actionTypes.SET_PARENTAL_RATING, { rating }));
    } catch (err) {
      /* istanbul ignore next */
      logger.error({
        err,
        user,
      }, 'Failed to decode user token for parsing the user rating');
    }

    if (isCoppaFetchUserAgeEnabledSelector(state)) {
      try {
        await dispatch(fetchUserAge());
      } catch (err) {
        // age gate will be shown to capture the user's age
        logger.info(err, 'Failed to fetch user age during client setup');
      }
    }
  }

  if (__OTTPLATFORM__ === 'VIZIO') {
    await setupVizioLinkStatus();
  }

  // checkTransferUser must be called after auth.user state has been established in redux store for logged-in users so we don't overwrite the existing user
  if (__OTTPLATFORM__ === 'FIRETV_HYB') {
    await checkTransferUser(store);
  }
};

export const tasksBeforeFetchData = ({ store, history }: { store: TubiStore; history: History }) => {
  const { dispatch, getState } = store;
  const state = getState();
  const isGDPREnabled = isGDPREnabledSelector(state);
  // We need to set the device id before getting the anonymous token on Samsung client
  // because the device id in cookies set by server is not accessible by js on the client side
  if (__OTTPLATFORM__ === 'TIZEN') {
    setDeviceIdForTokenRequests(state.auth.deviceId);
  }

  if (__OTTPLATFORM__ === 'XBOXONE') {
    setupXboxoneDeeplink(store);
  }

  const useTokenEndpoint = WebAnalyticsAnonymousToken().getValue();

  if (!useTokenEndpoint && state.auth && state.auth.user) {
    clearAnonymousTokens();
  }

  if (__ISOTT__ && isGDPREnabled) {
    // Listen consent changes and notify native
    // so native can disable/enable 3rd SDK based on consent
    setupConsentChangeListener();
  }

  /* istanbul ignore else */
  if (__IS_ALPHA_ENV__ || !__PRODUCTION__) setupSuitest(store);

  if (
    (__WEBPLATFORM__ === 'WEB' || __WEBPLATFORM__ === 'WINDOWS') &&
    (__IS_ALPHA_ENV__ || __STAGING__ || __DEVELOPMENT__)
  ) {
    setupFeatureSwitchManagerFromURI();
  }

  setFeatureSwitchManagerOnSelectParams(dispatch);

  disableSentryDuringFailSafe(store.getState());
  setupSDKTracking(store, history);

  if (!__ISOTT__) {
    polyfillIntersectionObserver();
    setupCastAPI(dispatch, getState);
  }

  // For some platforms with older browser version, polyfill intersection observer and abort controller
  // for viewable impressions support (intersection observer) and react-query support (abort controller)
  if (__SHOULD_POLYFILL_INTERSECTION_OBSERVER__) {
    polyfillIntersectionObserver();
  }

  if (__SHOULD_POLYFILL_ABORT_CONTROLLER__) {
    polyfillAbortController();
  }

  systemApi = setupSystemApi(dispatch, getState);

  dispatch(setAnalyticsConfig({ advertiser_id: systemApi.getAdvertiserId(), postal_code: systemApi.getZipcode() }));

  // only do this for special Fire TV Kids Mode promotion
  if (__OTTPLATFORM__ === 'FIRETV_HYB') deeplinkKidsMode(dispatch);

  setupCoppa(store, dispatch);

  if (__IS_FAILSAFE__ && __ISOTT__) {
    setupOTTLandingPage(store);
    setupOTTRelaunchPage();
  }

  setupPerformanceTracking(store);

  if (__IS_ALPHA_ENV__ || __STAGING__ || __DEVELOPMENT__) {
    setupTubiDebugBridge(store);
  }

  /* istanbul ignore next */
  if (
    (__WEBPLATFORM__ === 'WEB' || __WEBPLATFORM__ === 'WINDOWS' || __OTTPLATFORM__ === 'XBOXONE') &&
    (__STAGING__ || __PRODUCTION__)
  ) {
    setupOfflinePlugin();
  }

  createSnapshot();

  /* istanbul ignore else */
  if (ottPALIntegrationSelector(state)) {
    palNonceManager.preloadSDK();
  }
};

export const requestsBeforeFetchData = async ({ store, history }: { store: TubiStore; history: History }) => {
  await setupComcastDeeplink(store, history);
  // in failsafe mode, the deeplink is handled in client
  // we should setup the deeplink before run listenBefore
  if (__OTTPLATFORM__ === 'TIZEN' && __IS_FAILSAFE__) {
    await setupSamsungDeeplink(store);
  }
};

const logServerClientStateMismatch = (serverState: StoreState, clientState: StoreState) => {
  if (!__DEVELOPMENT__) {
    return;
  }
  const diff = getDiff(serverState, clientState);
  if (!diff) {
    return;
  }
  /* eslint-disable no-console -- dev only, for debugging purposes */
  try {
    /* eslint-disable-next-line compat/compat */
    console.group('Server/Client State Mismatch');
  } catch {
    console.log('Server/Client State Mismatch');
  }
  console.error(`#################################
Redux state on client does not match redux state from server. This can result in hydration mismatch errors, degraded performance, and can even cause react to render incorrectly!
https://www.notion.so/tubi/React-18-Upgrade-1a09c4550ba54120bd8851fbb28a8d7e
#################################`);
  console.log('server state', serverState);
  console.log('client state', clientState);
  diffLogger(diff);
  try {
    /* eslint-disable-next-line compat/compat */
    console.groupEnd();
  } catch {
    console.log('-- Server/Client State Mismatch end --');
  }
  /* eslint-enable no-console */
};

export const tasksAfterFetchData = async ({
  store,
  history,
  routes,
}: {
  store: TubiStore;
  history: History;
  routes: PlainRoute[];
}) => {
  setupTransitionHooks(history, store, routes);
  logServerClientStateMismatch(window.__data, store.getState());
  delete window.__data;
  await renderPage(store, history);
  hideLoadingSpinner();
  setupDevHMR(store, history);
  setupLongPress();
  // in non failsafe mode, the deeplink is handled in server
  if (__OTTPLATFORM__ === 'TIZEN' && !__IS_FAILSAFE__) {
    await setupSamsungDeeplink(store);
  }
  // wait until the homepage has fully loaded
  // to handle a deeplink on PS4. we don't know
  // when we will get a deeplink event and if the
  // homepage is loading this can lead to difficult
  // to debug situations.
  if (__OTTPLATFORM__ === 'PS4') {
    (systemApi as PS4SystemApi).startDeeplinks();
  }
  // currently we can not call `bridge.init` in `tasksBeforeFetchData`
  // since it will caused a race condition
  // see https://github.com/adRise/www/pull/9393
  addAuthChangeListener(
    store,
    [
      __OTTPLATFORM__ === 'LGTV'
        ? /* istanbul ignore next */ () => (systemApi as LGTVSystemApi).getPartnerKeyAndSetPersonalizedKey(store.dispatch)
        : undefined,
      ...(__ISOTT__ ? [notifyAccountChange, syncUserSessionToLocalStorage] : [syncLoginStatus]),
    ].filter((listener): listener is Exclude<typeof listener, undefined> => !!listener)
  );
  safeRequestIdleCallback(async () => {
    await trackUserSessionLengthInDays();
  });
  collectDeviceSpecInfo();
};

export const tasksAfterInit = (store: TubiStore, client: ApiClient) => {
  setupRemoteDebugger();
  if (__ISOTT__ && __OTTPLATFORM__ !== 'TIZEN') {
    // samsung uses file:// protocol, so we can't use the redirect experiment 😭
    setupRedirectExperiment(store, client);
  }
  setupForceFailsafeExperiment(store);
};

// Setup NS1 code to help Fox team evaluate CDN latency
/* istanbul ignore next */
function setupNS1PCode(countryCode: CountryCode | undefined) {
  if (__WEBPLATFORM__ !== 'WEB' || countryCode !== 'US') return;

  function x() {
    // @ts-expect-error: we need a global value
    window.__nspid = '7ia9f3';
    // @ts-expect-error: we need a global value
    window.__nsptags = [];
    const j = document.createElement('script'); j.type = 'text/javascript'; j.async = true;
    j.src = `http${document.location.protocol === 'https:' ? 's://cs' : '://c'}.ns1p.net/p.js?a=7ia9f3`;
    document.body.appendChild(j);
  }

  if (document.readyState === 'complete') {
    x();
  } else if (window.addEventListener) {
    window.addEventListener('load', x, false);
    // @ts-expect-error: compatibility with IE
  } else if (window.attachEvent) {
    // @ts-expect-error: compatibility with IE
    window.attachEvent('onload', x);
  } else {
    window.onload = x;
  }
}
