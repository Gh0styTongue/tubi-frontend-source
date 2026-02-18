import { createSelector } from 'reselect';

import type StoreState from 'common/types/storeState';

export const isWebCascadeMenuEnabledSelector = createSelector(
  ({ ui: { isMobile } }: StoreState) => isMobile,
  (isMobile) => {
    return !isMobile;
  }
);
