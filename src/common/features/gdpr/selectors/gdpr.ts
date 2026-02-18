import { createSelector } from 'reselect';

import { FEATURE_GEO_AVAILABILITY } from 'common/constants/geoFeatures';
import type StoreState from 'common/types/storeState';

export const isInGDPRCountrySelector = (state: StoreState) =>
  (FEATURE_GEO_AVAILABILITY.gdpr as (string | undefined)[]).includes(state.ui.twoDigitCountryCode);
/**
 * If user is in GDPR country with kids mode or Parental Controls are on (i.e. not Adult),
 * We need to disable some features, i.e. auto start for video preview
 */
export const isInGDPRCountryWithKidsSelector = createSelector(
  isInGDPRCountrySelector,
  (state: StoreState) => state.ui.isKidsModeEnabled,
  (state: StoreState) => state.userSettings.parentalRating,
  (isInGDPRCountry, isKidsModeEnabled) =>
    isInGDPRCountry
    && isKidsModeEnabled
);

export const isGDPREnabledSelector = createSelector(
  isInGDPRCountrySelector,
  // Disable GDPR feature in production as it is not ready to release currently
  (isInGDPRCountry) => __SHOULD_ENABLE_GDPR_IN_PLATFORM__ && isInGDPRCountry
);
