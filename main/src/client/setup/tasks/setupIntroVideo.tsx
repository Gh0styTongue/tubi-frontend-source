import { parseQueryString } from '@adrise/utils/lib/queryString';
import React from 'react';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import { Provider } from 'react-redux';

import { dismissComcastLoadingScreen } from 'client/introLib/comcast';
import { setDeviceResolution } from 'client/introLib/device';
import { ps4SpecificInitialization } from 'client/introLib/ps4';
import systemApi from 'client/systemApi';
import type { ComcastAdInfo } from 'client/systemApi/comcast-family';
import { loadFireboltSDK } from 'client/utils/fireboltSDK';
import { getCookie, removeCookie, setCookie } from 'client/utils/localDataStorage';
import { setAnalyticsConfig } from 'common/actions/tracking';
import { SET_INTRO_DISABLED, SET_INTRO_ENDED } from 'common/constants/action-types';
import { INTRO_ROOT_ID } from 'common/constants/constants';
import {
  COOKIE_ADVERTISER_ID,
  COOKIE_ADVERTISER_ID_EXPIRES_MS,
  DISABLE_ANIMATIONS_COOKIE_NAME,
} from 'common/constants/cookies';
import { TRACK_LOGGING } from 'common/constants/error-types';
import { shouldRenderIntroVideoSelector } from 'common/selectors/ottUI';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { TubiStore } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import type { SubRequest } from 'common/utils/deeplinkType';
import { shouldRenderIntroVideo } from 'common/utils/deeplinkType';
import { trackLogging } from 'common/utils/track';
import IntroAnimationLottie from 'ott/components/IntroAnimation/IntroAnimationLottie';
import IntroAnimationVideo from 'ott/components/IntroAnimation/IntroAnimationVideo';

const FORCE_RESOLVED_LANGUAGE_PROMISE_TIMEOUT = 4_000;
const FORCE_RESOLVED_ADVERTISERID_PROMISE_TIMEOUT = 15_000;
const FORCE_UNMOUNT_APP_INTRO_TIMEOUT = 15_000;

export const setupIntroVideo = (store: TubiStore) => {
  if (!checkIntroVideoIsDisabled(store)) {
    renderReactIntroVideo(store);
  }
};

export const setUpDeviceLanguage = (store: TubiStore) => {
  const setUpLanguagePromise = setUpLanguage(store);
  window._setUpPromises = Promise.all([setUpAdvertiserId(store), setUpLanguagePromise]);
  initPlatformState();
  if (__SHOULD_SETUP_I18N_ON_CLIENT__) {
    return setUpLanguagePromise;
  }
  return Promise.resolve(true);
};

const checkIntroVideoIsDisabled = (store: TubiStore) => {
  const disabledInCookie = getCookie(DISABLE_ANIMATIONS_COOKIE_NAME) === 'true';
  const { search, pathname } = location;
  const query = parseQueryString(search);
  const requestInfo: SubRequest = { query, path: pathname, url: pathname + search };
  const isDisabled =
    disabledInCookie ||
    !shouldRenderIntroVideo(requestInfo) ||
    ((!__PRODUCTION__ || __IS_ALPHA_ENV__) && query.qaSuitest) ||
    __DEV_DISABLE_INTRO_ANIMATION__ ||
    !__INTRO_ANIMATION_ENABLED_PLATFORMS__.includes(__OTTPLATFORM__) ||
    FeatureSwitchManager.isDisabled('IntroAnimation');

  store.dispatch(actionWrapper(SET_INTRO_DISABLED, { disabled: isDisabled }));
  return isDisabled;
};

/* istanbul ignore next */
const renderReactIntroVideo = (store: TubiStore) => {
  const introContainer = document.getElementById(INTRO_ROOT_ID);

  if (shouldRenderIntroVideoSelector(store.getState()) && introContainer) {
    const root: Root = createRoot(introContainer);
    const onEnd = () => {
      clearTimeout(forceUnmountTimer);
      root.unmount();
    };
    // we would like to force unmount to make sure the intro video can be removed after the timeout
    const forceUnmountTimer = setTimeout(() => {
      onEnd();
      store.dispatch(actionWrapper(SET_INTRO_ENDED, { ended: true }));
    }, FORCE_UNMOUNT_APP_INTRO_TIMEOUT);
    const IntroAnimation = __SHOULD_USE_LOTTIE_INTRO_ANIMATION__ ? IntroAnimationLottie : IntroAnimationVideo;
    root.render(
      <Provider store={store} key="provider">
        <IntroAnimation onEnd={onEnd} />
      </Provider>
    );
  }
};

/* istanbul ignore next */
const setUpLanguage = (store: TubiStore) => {
  return new Promise<boolean>((resolve) => {
    if (typeof window !== 'undefined') {
      const langtag = window.navigator.language || window.navigator.userLanguage;
      if (langtag) {
        const locale = langtag.split('-')[0];
        if (locale) {
          setCookie('DEVICE_LANGUAGE', locale.slice(0, 2));
        }
      }
    }
    // we would like to force resolve to make sure the analytics sent is not blocked by this promise
    const timer = setTimeout(() => {
      resolve(false);
    }, FORCE_RESOLVED_LANGUAGE_PROMISE_TIMEOUT);
    const resolvePromise = (result: boolean) => {
      clearTimeout(timer);
      resolve(result);
    };

    if (__IS_COMCAST_PLATFORM_FAMILY__) {
      const getComcastFamilyLanguageLocale = async () => {
        try {
          const fireboltSDK = await loadFireboltSDK();
          const [langLocale, postalCode] = await Promise.all([
            fireboltSDK.Localization.locale(),
            fireboltSDK.Localization.postalCode(),
          ]);
          if (langLocale) {
            setCookie('DEVICE_LANGUAGE', langLocale.slice(0, 2));
          }
          store.dispatch(setAnalyticsConfig(postalCode ? { postal_code: postalCode } : undefined));
          resolvePromise(true);
        } catch (error) {
          resolvePromise(false);
        }
      };
      getComcastFamilyLanguageLocale();
    } else if (__OTTPLATFORM__ === 'VIZIO') {
      if (window.VIZIO) {
        window.VIZIO.setDeviceLanguageHandler((language: { code: string }) => {
          setCookie('DEVICE_LANGUAGE', language.code);
          store.dispatch(setAnalyticsConfig());
          resolvePromise(true);
        });
      } else {
        resolvePromise(false);
      }
    } else if (__OTTPLATFORM__ === 'HISENSE') {
      // This is the language supported on the Hisense TV up to now. It is found on the device but not in the document yet.
      type Code_639_2 = 'eng' | 'chi' | 'zho' | 'spa' | 'fre' | 'ger';
      type Code_639_1 = 'en' | 'es' | 'fr' | 'zh' | 'de';

      const CODE_639_2_TO_CODE_639_1_MAP: {
        [key in Code_639_2]: Code_639_1;
      } = {
        eng: 'en',
        chi: 'zh',
        zho: 'zh',
        spa: 'es',
        fre: 'fr',
        ger: 'de',
      };
      if (typeof window.Hisense_GetMenuLanguageCode === 'function') {
        const menuLanguage = window.Hisense_GetMenuLanguageCode();
        setCookie('DEVICE_LANGUAGE', CODE_639_2_TO_CODE_639_1_MAP[menuLanguage] || 'en');
        store.dispatch(setAnalyticsConfig());
        resolvePromise(true);
      } else {
        resolvePromise(false);
      }
    } else {
      resolvePromise(true);
    }
  });
};

/* istanbul ignore next */
const initPlatformState = () => {
  setDeviceResolution();
  ps4SpecificInitialization();
  dismissComcastLoadingScreen();
};

/* istanbul ignore next */
const setUpAdvertiserId = (store: TubiStore) => {
  return new Promise<boolean>((resolve) => {
    let timeoutIsInvoked = false;
    // we would like to force resolve to make sure the analytics sent is not blocked by this promise
    const timer = setTimeout(() => {
      resolve(false);
      trackLogging({
        message: `Getting advertiser ID timed out on ${__OTTPLATFORM__} from intro page`,
        type: TRACK_LOGGING.clientInfo,
        subtype: 'intro:advertiserId',
      });
      timeoutIsInvoked = true;
    }, FORCE_RESOLVED_ADVERTISERID_PROMISE_TIMEOUT);
    const resolvePromise = (result: boolean) => {
      clearTimeout(timer);
      resolve(result);
    };

    if (systemApi.getAdvertiserId()) {
      resolvePromise(true);
      return;
    }

    if (__OTTPLATFORM__ === 'FIRETV_HYB' || __OTTPLATFORM__ === 'ANDROIDTV') {
      if (typeof TubiAndroidTVSDK !== 'undefined') {
        const idfa = TubiAndroidTVSDK.getAdvertiserIdentifer();
        if (idfa) {
          setCookie(COOKIE_ADVERTISER_ID, idfa, COOKIE_ADVERTISER_ID_EXPIRES_MS);
          store.dispatch(setAnalyticsConfig({ advertiser_id: idfa }));
        } else {
          removeCookie(COOKIE_ADVERTISER_ID);
        }
        resolvePromise(true);
      } else {
        resolvePromise(false);
      }
    // get and set advertiser ID for VIZIO
    // VIZIO's api to get the Ad ID is async, so we will make a callback once the API returns the Ad ID
    /* istanbul ignore next */
    } else if (__OTTPLATFORM__ === 'VIZIO') {
      const onVizioReady = () => {
        try {
          window.VIZIO.setAdvertiserIDListener((adInfo: { IFA: string }) => {
            const idfa = adInfo.IFA;
            if (idfa) {
              if (timeoutIsInvoked) {
                trackLogging({
                  message: 'advertiserId is set after timeout',
                  type: TRACK_LOGGING.clientInfo,
                  subtype: 'intro:advertiserId:afterTimeout',
                });
              }
              setCookie(COOKIE_ADVERTISER_ID, idfa, COOKIE_ADVERTISER_ID_EXPIRES_MS);
              store.dispatch(setAnalyticsConfig({ advertiser_id: idfa }));
            } else {
              trackLogging({
                message: 'adInfo.IFA is empty',
                type: TRACK_LOGGING.clientInfo,
                subtype: 'intro:advertiserId:ifaEmpty',
              });
              removeCookie(COOKIE_ADVERTISER_ID);
            }
            resolvePromise(true);
          });
        } catch (error) {
          trackLogging({
            message: `Getting advertiser error: ${error}`,
            type: TRACK_LOGGING.clientInfo,
            subtype: 'intro:advertiserId:error',
          });
          resolvePromise(false);
        }
      };

      const isLibraryLoaded = window.VIZIO && window.VIZIO.isLibraryLoaded;
      if (!isLibraryLoaded) {
        if (!window.VIZIO) {
          trackLogging({
            message: 'window.VIZIO is undefined',
            type: TRACK_LOGGING.clientInfo,
            subtype: 'intro:advertiserId:vizioEmpty',
          });
          resolvePromise(true);
        } else {
          document.addEventListener('VIZIO_LIBRARY_DID_LOAD', () => {
            onVizioReady();
          });
        }
      } else {
        onVizioReady();
      }
    } else if (__IS_COMCAST_PLATFORM_FAMILY__) {
      if (window.$badger) {
        const loadAdvertiserInfo = () => {
          window.$badger
            .adPlatform()
            .advertisingId()
            .success((adInfo: ComcastAdInfo) => {
              // Cause the comcast will crash if cookie size is too large,
              // we save it to sessionStorage
              sessionStorage && sessionStorage.setItem(COOKIE_ADVERTISER_ID, adInfo.ifa);
              store.dispatch(setAnalyticsConfig({ advertiser_id: adInfo.ifa }));
              resolvePromise(true);
            })
            .failure((error: string) => {
              trackLogging({
                message: `Error getting badger advertisingId on Comcast/Cox from intro page: ${error}`,
                type: TRACK_LOGGING.clientInfo,
                subtype: 'intro',
              });
              resolvePromise(false);
            });
        };
        if (window.$badger.active()) {
          loadAdvertiserInfo();
        } else {
          document.addEventListener('onMoneyBadgerReady', loadAdvertiserInfo);
        }
      } else {
        resolvePromise(false);
      }
    // get and set advertiser ID for LGTV
    /* istanbul ignore next */
    } else if (__OTTPLATFORM__ === 'LGTV') {
      try {
        const appId = window.webOS.fetchAppId() || 'com.tubitv.ott.tubi';
        window.webOS.service.request('luna://com.webos.service.admanager', {
          method: 'getAdid',
          subscribe: true,
          parameters: {
            appId,
          },
          onSuccess: (response: { IFA: string; LMT: string }) => {
            if (response?.IFA) {
              setCookie(COOKIE_ADVERTISER_ID, response.IFA, COOKIE_ADVERTISER_ID_EXPIRES_MS);
              store.dispatch(setAnalyticsConfig({ advertiser_id: response.IFA }));
            } else {
              removeCookie(COOKIE_ADVERTISER_ID);
            }
            resolvePromise(true);
          },
          onFailure() {
            removeCookie(COOKIE_ADVERTISER_ID);
            resolvePromise(false);
          },
        });
      } catch (error) {
        removeCookie(COOKIE_ADVERTISER_ID);
        resolvePromise(false);
      }
    } else {
      resolvePromise(true);
    }
  });
};
