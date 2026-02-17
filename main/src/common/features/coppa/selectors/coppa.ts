import { createSelector } from 'reselect';

import {
  IS_COPPA_AGE_GATE_ENABLED,
  IS_COPPA_ENABLED,
  IS_COPPA_EXIT_KIDS_MODE_ENABLED,
} from 'common/constants/constants';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import { isDeepLinkedSelector } from 'common/selectors/deepLink';
import { isKidsModeSelector } from 'common/selectors/ui';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { StoreState } from 'common/types/storeState';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';

const isCoppaAvailableInCountry = (state: StoreState): boolean => {
  const isAvailableInCountry = isFeatureAvailableInCountry('coppa', state.ui.twoDigitCountryCode);
  if (__ISOTT__) {
    // On OTT check if COPPA is available in country and if feature switch is enabled
    return isAvailableInCountry && FeatureSwitchManager.isDefault(['COPPA']);
  }
  return isAvailableInCountry;
};

export const isUserCoppaCompliantSelector = (state: StoreState): boolean => {
  return state.userSettings.coppaState === UserCoppaStates.COMPLIANT;
};

export const isUserNotCoppaCompliantSelector = (state: StoreState): boolean => {
  return state.userSettings.coppaState === UserCoppaStates.NOT_COMPLIANT;
};

export const isUserCoppaRequireLogoutSelector = (state: StoreState): boolean => {
  return state.userSettings.coppaState === UserCoppaStates.REQUIRE_LOGOUT;
};

export const isInCoppaLenientCountry = (state: StoreState) => {
  return state.ui.twoDigitCountryCode && ['MX', 'AU'].includes(state.ui.twoDigitCountryCode);
};

export const isAgeGateRequiredSelector = (state: StoreState): boolean => {
  if (!IS_COPPA_AGE_GATE_ENABLED || !isCoppaEnabledSelector(state)) {
    return false;
  }
  const isLoggedIn = isLoggedInSelector(state);
  if (isLoggedIn) {
    return state.userSettings.coppaState === UserCoppaStates.REQUIRE_AGE_GATE;
  }
  return false;
};

export const isCoppaEnabledSelector = (state: StoreState): boolean => {
  if (!IS_COPPA_ENABLED) {
    return false;
  }
  return isCoppaAvailableInCountry(state);
};

export const isThirdPartySDKTrackingEnabledSelector = createSelector(
  isAgeGateRequiredSelector,
  isUserNotCoppaCompliantSelector,
  isCoppaEnabledSelector,
  isKidsModeSelector,
  (isAgeGateRequired, isUserNotCoppaCompliant, isCoppaEnabled, isKidsModeEnabled) => {
    return !isAgeGateRequired && !isUserNotCoppaCompliant && !(isCoppaEnabled && isKidsModeEnabled);
  },
);

export const isCoppaFetchUserAgeEnabledSelector = (state: StoreState): boolean => {
  if (!IS_COPPA_AGE_GATE_ENABLED) {
    return false;
  }
  return isCoppaAvailableInCountry(state);
};

export const isCoppaExitKidsModeEnabledSelector = (state: StoreState): boolean => {
  if (!IS_COPPA_EXIT_KIDS_MODE_ENABLED) {
    return false;
  }

  const isLoggedIn = isLoggedInSelector(state);
  return !isLoggedIn && isCoppaAvailableInCountry(state) && FeatureSwitchManager.isDefault(['COPPAExitKidsMode']);
};

export const forceKidsModeParamsSelector = (state: StoreState) => {
  const isDeeplink = isDeepLinkedSelector(state);
  const forceKidsModeParams = {
    isKidsMode: false,
    force: false,
  };

  if (isUserNotCoppaCompliantSelector(state) && isDeeplink) {
    // User is not COPPA compliant, limit content to kids mode
    forceKidsModeParams.isKidsMode = true;
    // Force true to avoid taking result from cache since variable isKidsMode is not part of the cache key
    forceKidsModeParams.force = true;
  }
  return forceKidsModeParams;
};

export const shouldShowParentalRatingsSelector = createSelector(
  ({ ui: { twoDigitCountryCode } }: StoreState) => !isFeatureAvailableInCountry('gdpr', twoDigitCountryCode),
  ({ ui: { isKidsModeEnabled } }: StoreState) => isKidsModeEnabled,
  (state: StoreState) => isUserNotCoppaCompliantSelector(state),
  (isFeatureAvailable, isInKidsMode, isUserNotCoppaCompliant) => isFeatureAvailable && !(isInKidsMode && isUserNotCoppaCompliant)
);
