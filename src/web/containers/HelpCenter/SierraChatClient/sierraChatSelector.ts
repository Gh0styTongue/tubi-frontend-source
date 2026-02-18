import { createSelector } from 'reselect';

import type { StoreState } from 'common/types/storeState';

export const sierraChatEnabledSelector = createSelector(
  ({ ui: { twoDigitCountryCode } }: StoreState) => twoDigitCountryCode,
  (country) => country === 'US'
);
