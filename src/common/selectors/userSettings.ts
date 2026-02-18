import { createSelector } from 'reselect';

import { ParentalRating } from 'common/constants/ratings';
import type { StoreState } from 'common/types/storeState';

const userSettingsSelector = (store: StoreState) => store.userSettings;

export const firstNameSelector = createSelector(userSettingsSelector, (userSettings) => userSettings.first_name);

export const parentalRatingSelector = createSelector(
  userSettingsSelector,
  (userSettings) => userSettings.parentalRating
);

export const isParentalRatingKidsSelector = createSelector(
  parentalRatingSelector,
  (parentalRating: number): boolean => parentalRating < ParentalRating.TEENS
);

export const isParentalRatingTeensOrAdultsSelector = createSelector(
  parentalRatingSelector,
  (parentalRating: number): boolean => parentalRating >= ParentalRating.TEENS
);

export const userBirthdaySelector = createSelector(
  userSettingsSelector,
  (userSettings) => userSettings.birthday
);

export const userEmailSelector = createSelector(
  userSettingsSelector,
  (userSettings) => userSettings.email
);
