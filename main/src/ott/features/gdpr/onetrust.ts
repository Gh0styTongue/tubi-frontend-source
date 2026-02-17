import { ONETRUST_SDK_INITED_EVENT_NAME } from 'common/features/gdpr/onetrust/onetrust';
import { getOnetrustIdentifier, onScriptLoadError } from 'common/features/gdpr/onetrust/utils';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import logger from 'common/helpers/logging';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type StoreState from 'common/types/storeState';
import { getOTTRemote } from 'common/utils/keymap';
import { patchPromiseFinally } from 'common/utils/promise';
import type { CountryType } from 'i18n/constants';
import { hideLoadingSpinner } from 'ott/utils/loadingSpinner';
import type { OneTrustConfig } from 'types/onetrust';

const OTT_ONETRUST_SDK_VERSION = '202409.1.0';

type GDPR_ENABLED_PLATFORM = 'FIRETV_HYB'| 'LGTV'| 'XBOXONE'| 'HISENSE'| 'SONY'| 'PS5'| 'PS4'| 'ANDROIDTV'| 'TIZEN' | 'NETGEM' | 'TIVO';

const ONETRUST_APP_ID: Record<GDPR_ENABLED_PLATFORM, string> = {
  FIRETV_HYB: '018feb7e-69fa-7338-aa25-35659012125b',
  LGTV: '018fc702-256b-78cb-ab82-0831be03524a',
  XBOXONE: '018feb80-1d78-7d0e-80b5-2c492c152dbb',
  HISENSE: '018feb7f-6e91-7f8f-afd7-544ddbba68e3',
  SONY: '018feb7f-f11d-74b4-bb8c-8802c958821d',
  PS5: '018feb7f-a77b-75ea-8ba5-931207a12c70',
  PS4: '018feb7f-8b94-7525-8bd9-a272e985deda',
  ANDROIDTV: '018feb7f-1420-7b0d-87ba-d8787207e10f',
  TIZEN: '018feb7f-3c08-750e-88d2-e021cae1c319',
  NETGEM: '019324e9-6f33-7df5-a7ad-d58bc8ccfb31',
  TIVO: '019322ef-9050-79b3-ad8e-0d9ffc2c51e0',
};

export const initOneTrustForOTT = (state: StoreState) => {
  const isGDPREnabled = isGDPREnabledSelector(state);
  if (!isGDPREnabled) {
    return;
  }
  // Load onetrust script
  const script = document.createElement('script');
  /* istanbul ignore next */
  const scriptName = __OTTPLATFORM__ === 'TIZEN' ? 'onetrust-samsung' : 'onetrust';
  script.src = `https://mcdn.tubitv.com/tubitv-assets/js/onetrust/${OTT_ONETRUST_SDK_VERSION}/${scriptName}.js`;
  /* istanbul ignore next */
  script.onload = () => {
    patchPromiseFinally();
    setupOnetrust(state);
    // dispatch a event to let App know it's ready to show UI
    document.dispatchEvent(new Event(ONETRUST_SDK_INITED_EVENT_NAME));
  };
  script.onerror = onScriptLoadError;
  document.body.appendChild(script);
};

const setupOnetrust = (state: StoreState) => {
  if (!window.oneTrustTV) {
    /* istanbul ignore next */
    logger.error('oneTrustTV does not exist on window');
    return;
  }
  const REMOTE = getOTTRemote();
  // See: https://developer.onetrust.com/onetrust/docs/configure-sdk-parameters
  const config: OneTrustConfig = {
    key: `${ONETRUST_APP_ID[__OTTPLATFORM__]}${__STAGING__ || __DEVELOPMENT__ ? '-test' : ''}`,
    // OT only accept languageCode like `en`, not `en-US`
    languageCode: state.ui.userLanguageLocale.split('-')[0],
    version: OTT_ONETRUST_SDK_VERSION,
    storageLocation: 'cdn.cookielaw.org',
    syncProfile: true,
    identifier: getOnetrustIdentifier(state.auth.deviceId),
  };
  if (__STAGING__ || __IS_ALPHA_ENV__ || __DEVELOPMENT__) {
    const featureSwitchCountry = FeatureSwitchManager.get('Country') as CountryType;
    if (featureSwitchCountry && featureSwitchCountry !== FeatureSwitchManager.DEFAULT_VALUE) {
      config.countryCodeOverride = featureSwitchCountry;
    }
  }
  window.oneTrustTV.Settings(config);
  window.oneTrustTV.setRemoteKeycodes({
    [REMOTE.arrowLeft]: 'left',
    [REMOTE.arrowDown]: 'down',
    [REMOTE.arrowRight]: 'right',
    [REMOTE.arrowUp]: 'up',
    [REMOTE.enter]: 'ok',
    [REMOTE.back!]: 'back',
  });
};

export const waitUntilUserGiveConsent = (element?: Element | null) =>
  new Promise((resolve) => {
    if (element) {
      // Onetrust SKD already inited
      /* istanbul ignore next */
      if (window.oneTrustTV) {
        setupUI(element, resolve);
      } else {
        document.addEventListener(ONETRUST_SDK_INITED_EVENT_NAME, () => {
          setupUI(element, resolve);
        });
      }
      return;
    }
    if (!window.oneTrustTV || !element) {
      return resolve(true);
    }
    setupUI(element, resolve);
  });

const setupUI = (element: Element, resolve: (status: unknown) => void) => {
  // Show initial consent
  // It should always be called to get the consent data
  // See https://developer.onetrust.com/onetrust/docs/display-user-interfaces
  window.oneTrustTV.setupUI(element, 'BANNER', null, (status) => {
    resolve(status);
  });
  // Remove loading when OT banner shown
  window.oneTrustTV.shouldshowBanner((status) => {
    if (status) {
      hideLoadingSpinner();
    }
  });
};
