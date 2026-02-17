import { createSelector } from 'reselect';

import type { StoreState } from 'common/types/storeState';

export const deviceIdSelector = createSelector(
  ({ auth }: StoreState) => auth,
  (auth) => auth.deviceId,
);
