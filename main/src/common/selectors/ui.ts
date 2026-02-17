import { createSelector } from 'reselect';

import { BACK_FROM_DETAIL_TO_HOME, BACK_FROM_PLAYBACK_TO_DETAIL, IS_PLATFORM_SUPPORT_SCREENSAVER } from 'common/constants/constants';
import { ParentalRating } from 'common/constants/ratings';
import { WEB_ROUTES } from 'common/constants/routes';
import { isInGDPRCountrySelector, isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import type { StoreState } from 'common/types/storeState';
import { mobilePlaybackSupported } from 'common/utils/capabilityDetection';
import { getRatingsDropdownValues } from 'common/utils/ratings';
import { isWebContentGridPages, matchesRoute } from 'common/utils/urlPredicates';
import { SUPPORTED_COUNTRY, SUPPORTED_LANGUAGE } from 'i18n/constants';
import { FidelityLevel } from 'ott/utils/uiFidelity';

import { isMobileWebAndroidPlaybackEnabledSelector } from './experiments/webAndroidPlaybackSelector';
import { isMobileWebIosPlaybackEnabledSelector } from './experiments/webIosPlaybackSelector';
import { parentalRatingSelector } from './userSettings';

export const uiSelector = ({ ui }: StoreState) => ui;

export const countryCodeSelector = createSelector(uiSelector, ({ twoDigitCountryCode }) => twoDigitCountryCode);

export const isUsCountrySelector = createSelector(
  countryCodeSelector,
  (countryCode) => countryCode === SUPPORTED_COUNTRY.US
);

export const isMxCountrySelector = createSelector(
  countryCodeSelector,
  (countryCode) => countryCode === SUPPORTED_COUNTRY.MX
);

export const isLatamCountrySelector = createSelector(countryCodeSelector, (countryCode) =>
  [
    SUPPORTED_COUNTRY.CR,
    SUPPORTED_COUNTRY.EC,
    SUPPORTED_COUNTRY.GT,
    SUPPORTED_COUNTRY.PA,
    SUPPORTED_COUNTRY.MX,
    SUPPORTED_COUNTRY.SV,
  ].includes(countryCode as SUPPORTED_COUNTRY)
);

export const isPacificCountrySelector = createSelector(countryCodeSelector, (countryCode) =>
  [SUPPORTED_COUNTRY.AU, SUPPORTED_COUNTRY.NZ].includes(countryCode as SUPPORTED_COUNTRY)
);

export const isEnglishLanguageSelector = createSelector(
  uiSelector,
  ({ userLanguageLocale }) => userLanguageLocale.slice(0, 2) === SUPPORTED_LANGUAGE.EN
);

export const isSpanishLanguageSelector = createSelector(
  uiSelector,
  ({ userLanguageLocale }) => userLanguageLocale.slice(0, 2) === SUPPORTED_LANGUAGE.ES
);

export const parentalRatingsSelector = createSelector(
  isInGDPRCountrySelector,
  isUsCountrySelector,
  (isInGDPRCountry: boolean, isUsCountry: boolean) => {
    return getRatingsDropdownValues(isInGDPRCountry, isUsCountry);
  }
);

/**
 * First written for use on web to help determine when to enable Youbora
 * monitoring, as on some devices users are redirected to install the
 * native app and we do not play video or load Youbora
 */
export const isPlaybackEnabledSelector = (state: StoreState) => {
  const {
    ui: { isMobile, userAgent },
  } = state;
  const enableMobileWebIosPlayback = isMobileWebIosPlaybackEnabledSelector(state);
  const enableWebAndroidPlayback = isMobileWebAndroidPlaybackEnabledSelector(state);

  // Do not load Youbora lib if it's on mobile && playback is disabled
  const mobilePlaybackEnabled = mobilePlaybackSupported({ userAgent, enableMobileWebIosPlayback, enableWebAndroidPlayback });
  return !!__OTTPLATFORM__ || (__WEBPLATFORM__ && !isMobile) || (__WEBPLATFORM__ && isMobile && mobilePlaybackEnabled);
};

export const isScreensaverVisibleSelector = createSelector(
  uiSelector,
  ({ screensaverCounter }) => screensaverCounter <= 0 && IS_PLATFORM_SUPPORT_SCREENSAVER
);

export const isSlowDeviceSelector = createSelector(uiSelector, ({ isSlowDevice }) => isSlowDevice);

export const isKidsModeSelector = createSelector(uiSelector, ({ isKidsModeEnabled }) => isKidsModeEnabled);

export const isAdultsModeSelector = createSelector(
  isKidsModeSelector,
  parentalRatingSelector,
  (isKidsModeEnabled, parentalRating) => !isKidsModeEnabled && parentalRating === ParentalRating.ADULTS
);

/**
 * This returns true for mobile phone user agent only - contrast `isMobile` flag
 * and `isMobileDeviceSelector` which include both mobile phone and tablet user
 * agents
 */
export const isMobilePhoneDeviceSelector = createSelector(uiSelector, ({ userAgent }) => {
  const { deviceType } = userAgent.device;
  return !__ISOTT__ && deviceType === 'mobile';
});

/**
 * Returns true for both mobile phone and tablet user agents. Equivalent to
 * `ui.isMobile`.
 */
export const isMobileDeviceSelector = createSelector(uiSelector, ({ isMobile }) => isMobile);

const ageGateModalSelector = createSelector(uiSelector, ({ ageGateModal }) => ageGateModal);

export const isAgeGateModalVisibleSelector = createSelector(ageGateModalSelector, ({ isVisible }) => isVisible);

export const isHoverOnTilePreviewSelector = createSelector(
  uiSelector,
  ({ activeTilePreviewCount }) => activeTilePreviewCount > 0
);

export const remindModalSelector = createSelector(uiSelector, ({ remindModal }) => remindModal);

export const viewportTypeSelector = createSelector(uiSelector, ({ viewportType }) => viewportType);

export const showAppDownloadBannerSelector = createSelector(
  uiSelector,
  ({ showAppDownloadBanner }) => showAppDownloadBanner
);

export const isEspanolModeEnabledSelector = createSelector(
  uiSelector,
  ({ isEspanolModeEnabled }) => isEspanolModeEnabled
);

export const isFullscreenSelector = createSelector(uiSelector, ({ fullscreen }) => fullscreen);

export const userAgentSelector = createSelector(uiSelector, ({ userAgent }) => userAgent);

export const isFidelityLevelHighSelector = createSelector(
  uiSelector,
  ({ uiFidelity }) => uiFidelity === FidelityLevel.High
);

export const isStubiosNavEnabledSelector = createSelector(
  isEnglishLanguageSelector,
  isEspanolModeEnabledSelector,
  isKidsModeSelector,
  isUsCountrySelector,
  viewportTypeSelector,
  (isEnglishLanguage, isEspanolModeEnabled, isKidsModeEnabled, isUsCountry, viewportType) => {
    const conditions = [
      isEnglishLanguage,
      !isEspanolModeEnabled,
      !isKidsModeEnabled,
      isUsCountry,
      viewportType === 'mobile',
    ];

    return conditions.every((condition) => condition === true);
  }
);

export const isAppDownloadBannerAvailableSelector = createSelector(
  isGDPREnabledSelector,
  isKidsModeSelector,
  isUsCountrySelector,
  userAgentSelector,
  viewportTypeSelector,
  (_state: StoreState, pathname: string) => pathname,
  (isGDPREnabled, isKidsMode, isUsCountry, userAgent, viewportType, pathname) => {
    const conditions = [
      __WEBPLATFORM__ === 'WEB',
      !isGDPREnabled,
      !isKidsMode,
      isUsCountry,
      !/safari/i.test(userAgent.browser.name || ''),
      userAgent.device.deviceType === 'mobile',
      viewportType === 'mobile',
      [
        WEB_ROUTES.home,
        WEB_ROUTES.movies,
        WEB_ROUTES.tvShows,
        WEB_ROUTES.landing,
        WEB_ROUTES.movieDetail,
        WEB_ROUTES.tvShowDetail,
        WEB_ROUTES.live,
        WEB_ROUTES.categoryIdTitle,
      ].find((route) => matchesRoute(route, pathname)) !== undefined,
    ];

    return conditions.every((condition) => condition === true);
  }
);

export const appDownloadBannerSelector = createSelector(
  isAppDownloadBannerAvailableSelector,
  showAppDownloadBannerSelector,
  (isAvailable, showAppDownloadBanner) => {
    const isShown = isAvailable && showAppDownloadBanner;

    return {
      isAvailable,
      isShown,
    };
  }
);
export const isInTheaterModeSelector = createSelector(uiSelector, ({ isTheater }) => isTheater);

export const userLanguageLocaleSelector = createSelector(uiSelector, ({ userLanguageLocale }) => userLanguageLocale);

export const shouldOverridePlayerBackPressSelector = createSelector(uiSelector, ({ browseWhileWatchingBackOverrides }) => {
  return browseWhileWatchingBackOverrides[BACK_FROM_PLAYBACK_TO_DETAIL];
});

export const shouldOverrideDetailsBackPressSelector = createSelector(uiSelector, ({ browseWhileWatchingBackOverrides }) => {
  return browseWhileWatchingBackOverrides[BACK_FROM_DETAIL_TO_HOME];
});

export const shouldHideMetadataSelector = createSelector(
  viewportTypeSelector,
  (_state: StoreState, pathname: string) => pathname,
  (viewportType, pathname) => viewportType === 'desktop' && isWebContentGridPages(pathname)
);
