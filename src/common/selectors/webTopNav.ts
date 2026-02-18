import { createSelector } from 'reselect';

import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import {
  isAgeGateRequiredSelector,
  isCoppaEnabledSelector,
  isUserCoppaCompliantSelector,
} from 'common/features/coppa/selectors/coppa';
import type StoreState from 'common/types/storeState';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';

import { isParentalRatingKidsSelector } from './userSettings';

export const isMovieAndTVShowNavEnabledSelector = createSelector(
  isCoppaEnabledSelector,
  isUserCoppaCompliantSelector,
  isAgeGateRequiredSelector,
  isParentalRatingKidsSelector,
  ({ ui: { isKidsModeEnabled } }: StoreState) => isKidsModeEnabled,
  ({ ui: { isEspanolModeEnabled } }: StoreState) => isEspanolModeEnabled,
  ({ ui: { twoDigitCountryCode } }: StoreState) => isFeatureAvailableInCountry('webMovieAndTVShowNav', twoDigitCountryCode),
  (
    isCoppaEnabled,
    isUserCoppaCompliant,
    isAgeGateRequired,
    isParentalRatingKids,
    isKidsModeEnabled,
    isEspanolModeEnabled,
    isFeatureAvailableInCountry
  ) => {
    if (
      isKidsModeEnabled
      || isEspanolModeEnabled
      || !isFeatureAvailableInCountry
      || isParentalRatingKids
    ) {
      return false;
    }
    if (isCoppaEnabled) {
      if (isAgeGateRequired) {
        return true;
      }
      return isUserCoppaCompliant;
    }
    return true;
  }
);

export const isWebMyStuffEnabledSelector = createSelector(
  isLoggedInSelector,
  ({ ui: { twoDigitCountryCode } }: StoreState) => isFeatureAvailableInCountry('webMyStuff', twoDigitCountryCode),
  (isLoggedIn, isWebMyStuffEnabled) => isLoggedIn && isWebMyStuffEnabled
);
