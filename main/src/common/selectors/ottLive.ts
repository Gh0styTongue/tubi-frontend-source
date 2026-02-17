import { createSelector } from 'reselect';

import { ParentalRating } from 'common/constants/ratings';
import type { StoreState } from 'common/types/storeState';

export const shouldShowOTTLinearContentSelector = createSelector(
  () => __IS_LIVE_NEWS_ENABLED__,
  ({ ui: { isKidsModeEnabled } }: StoreState) => isKidsModeEnabled,
  ({ remoteConfig: { isLiveAvailableInCountry } }: StoreState) => isLiveAvailableInCountry,
  ({ userSettings: { parentalRating } }: StoreState) => parentalRating > ParentalRating.TEENS,
  (shouldShowLinearContent, isKidsModeEnabled, isLiveAvailableInCountry, isParentalRatingHigherThanTeens) => {
    return shouldShowLinearContent && !isKidsModeEnabled && isLiveAvailableInCountry && isParentalRatingHigherThanTeens;
  }
);
