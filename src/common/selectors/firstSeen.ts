import { createSelector } from 'reselect';

import type { StoreState } from 'common/types/storeState';

export const firstSeenSelector = createSelector(
  ({ auth }: StoreState) => auth,
  (auth) => auth.firstSeen,
);
