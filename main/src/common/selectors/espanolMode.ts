import { createSelector } from 'reselect';

import type StoreState from 'common/types/storeState';
import { isFeatureAvailableInCountry } from 'common/utils/geoFeatures';
import { isParentalRatingTeensOrLess } from 'common/utils/ratings';

/**
 * return true if the Espanol mode is available
 */
export const isSupportEspanolModeSelector = createSelector(
  ({ ui: { isKidsModeEnabled } }: StoreState) => isKidsModeEnabled,
  ({ ui: { twoDigitCountryCode } }: StoreState) => twoDigitCountryCode,
  ({ userSettings: { parentalRating } }: StoreState) => parentalRating,
  (isKidsModeEnabled, twoDigitCountryCode, parentalRating) => {
    return !isKidsModeEnabled
      && !isParentalRatingTeensOrLess(parentalRating)
      && isFeatureAvailableInCountry('espanolMode', twoDigitCountryCode);
  },
);

/**
 * return true if the Espanol mode is available on the WEB top nav
 */
export const shouldShowEspanolMenuOnWebSelector = createSelector(
  isSupportEspanolModeSelector,
  ({ ui: { isEspanolModeEnabled } }: StoreState) => isEspanolModeEnabled,
  (isSupportEspanolMode, isEspanolModeEnabled) => {
    return isSupportEspanolMode && !isEspanolModeEnabled;
  },
);
