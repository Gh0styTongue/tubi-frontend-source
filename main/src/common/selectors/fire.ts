import { createSelector } from 'reselect';

import { SAMSUNG_CW_SUPPORT } from 'common/constants/platforms';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type { StoreState } from 'common/types/storeState';
import type { VideoRating } from 'common/types/video';
import {
  isHdmiConnectHandlerAvailable,
  isNativeDRMAvailable,
  isNativeNewAnalyticsAvailable,
} from 'common/utils/hybAppUtils';
import { semverCompareTo } from 'common/utils/version';

import { appVersionSelector } from './fireUtils';
import { isUsCountrySelector, isMxCountrySelector } from './ui';

const modelCodeSelector = ({ fire }: StoreState) => fire.modelCode || ''; // modelCode only has value on Samsung so far

export const fireSelector = (state: StoreState) => state.fire;

const uaSelector = ({ ui }: StoreState) => ui?.userAgent || {};

export const isAudioDescriptionsModalVisibleSelector = createSelector(
  fireSelector, ({ showModal, modal }) => !!showModal && modal?.type === 'audioDescriptions'
);

export const isExitSignUpModalVisibleSelector = createSelector(
  fireSelector, ({ showModal, modal }) => !!showModal && modal?.type === 'exitSignup'
);

export const isFeedbackModalVisibleSelector = createSelector(
  fireSelector, ({ showModal, modal }) => !!showModal && modal?.type === 'feedback'
);

export const isModalShownSelector = createSelector(
  fireSelector, ({ showModal, modal }) => !!showModal && !!modal
);

export const isFirstSessionSelector = createSelector(
  fireSelector, ({ isFirstSession }) => isFirstSession,
);

export const modalSelector = createSelector(
  fireSelector, ({ modal }) => modal
);

export interface ContentWithRatings {
  ratings?: VideoRating[];
}

export const isHdmiConnectHandlerAvailableSelector = createSelector(
  appVersionSelector,
  (appVersion) => isHdmiConnectHandlerAvailable(appVersion.code),
);

export const isNativeNewAnalyticsAvailableSelector = createSelector(
  appVersionSelector,
  (appVersion) => isNativeNewAnalyticsAvailable(appVersion.code),
);

export const isNativeDRMAvailableSelector = createSelector(
  appVersionSelector,
  (appVersion) => isNativeDRMAvailable(appVersion.code),
);

export const isPSSHv0Supported = createSelector(
  appVersionSelector,
  appVersion => (!__IS_ANDROIDTV_HYB_PLATFORM__ || !!(appVersion.semver && semverCompareTo(appVersion.semver, '4.15.0') >= 0)),
);

export const isMediaPreloadSupportedOnATVSelector = createSelector(
  appVersionSelector,
  ({ semver = 0 }) => __OTTPLATFORM__ === 'ANDROIDTV' && semverCompareTo(semver, '4.40.0') >= 0,
);

export const isCommonBridgeEventSupportedSelector = createSelector(
  appVersionSelector,
  ({ semver = 0 }) => __IS_HYB_APP__ && semverCompareTo(semver, '7.12.0') >= 0,
);

// DRM is not supported on Samsung 2015 model
export const isDRMSupportedVersionOnSamsung = createSelector(
  modelCodeSelector,
  (modelCode: string) => {
    let manufactureYear = null;
    // Model code is a string like "15_HAWKP".
    // https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/productinfo-api.html
    const year = typeof modelCode === 'string' ? modelCode.split('_').shift() : null;
    manufactureYear = year?.length === 2 ? year : null;
    return Number(manufactureYear) > 15;
  },
);

// Samsung CW behaves differently according to TV models
export const cwSupportedVersionOnSamsungSelector = createSelector(
  modelCodeSelector,
  isUsCountrySelector,
  (modelCode: string, isUsCountry: boolean) => {
    // Model code is a string like "15_HAWKP".
    // https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/productinfo-api.html
    const year = typeof modelCode === 'string' ? modelCode.split('_').shift() : null;
    const manufactureYear = year?.length === 2 ? Number(year) : null;

    // The oldest TV model we support is 2015, so we only need to check if year < 18.
    // The CW will be enabled on US only.
    if (!manufactureYear || manufactureYear < 18 || !isUsCountry) return '';

    // TODO(yuhao): 20/21 models will support CW in Aug, need to change the empty value to SAMSUNG_CW_SUPPORT.HOME at that time
    return manufactureYear >= 20 ? '' : SAMSUNG_CW_SUPPORT.UG;
  },
);

function shouldGateContentInMxCountry(content: ContentWithRatings): boolean {
  return !!content.ratings?.some(rating => rating.code === 'NC-17');
}

/**
 * Returns a callback function that can be used to determine whether a mature
 * content modal should be shown for a given video. The modal should prompt the
 * user to sign in before watching mature content.
 */
export const shouldShowMatureContentModalSelector = createSelector(
  isLoggedInSelector,
  // Will not change during application lifecycle but may change during tests
  isMxCountrySelector,
  (isLoggedIn,
    isMxCountry) => {
    if (!isLoggedIn) {
      return (content: ContentWithRatings) => isMxCountry && shouldGateContentInMxCountry(content);
    }
    return () => false;
  },
);

export const enableHEVCSelector = createSelector(
  appVersionSelector,
  ({ semver = 0 }) => {
    if (!__SERVER__) {
      if (__OTTPLATFORM__ === 'ANDROIDTV') {
        return semverCompareTo(semver, '4.33.0') >= 0;
      }
      return;
    }
    // Server side cannot detect the HEVC/4K ability of client side
    // So we hardcode the ability here for server render
    // Then we'll check hevc ability in VideoResourceManager.checkCodecFallback
    return !__TESTING__;
  },
);

export const enable4KSelector = createSelector(
  uaSelector,
  (userAgent) => {
    if (!__SERVER__) return;
    // Server side cannot detect the HEVC/4K ability of client side
    // So we hardcode the ability here for server render
    const isInSafari = __WEBPLATFORM__ && userAgent.browser?.name === 'Safari';
    const isInPS5Device = __OTTPLATFORM__ === 'PS5';
    return isInSafari || isInPS5Device;
  }
);

export const enableHlsv6OnAndroidTVSelector = createSelector(
  appVersionSelector,
  ({ semver = 0 }) => {
    if (__IS_ANDROIDTV_HYB_PLATFORM__) {
      return semverCompareTo(semver, '4.43.2') >= 0;
    }
    return false;
  }
);

