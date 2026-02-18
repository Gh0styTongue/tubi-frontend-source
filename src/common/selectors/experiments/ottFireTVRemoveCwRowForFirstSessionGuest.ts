import { createSelector } from 'reselect';

import {
  getConfig,
  FIRETV_REMOVE_CW_ROW_FOR_FIRST_SESSION_GUEST,
} from 'common/experiments/config/ottFireTVRemoveCwRowForFirstSessionGuest';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isUserNotCoppaCompliantSelector } from 'common/features/coppa/selectors/coppa';
import { popperExperimentsSelector } from 'common/selectors/experiments';
import { isFirstSessionSelector } from 'common/selectors/fire';
import type { StoreState } from 'common/types/storeState';

export const ottFireTVRemoveCwRowForFirstSessionGuestSelector = (state: StoreState) => popperExperimentsSelector(state, {
  ...FIRETV_REMOVE_CW_ROW_FOR_FIRST_SESSION_GUEST,
  config: getConfig(),
});

export const isRemoveCwRowExperimentEnabledSelector = createSelector(
  isUserNotCoppaCompliantSelector,
  isLoggedInSelector,
  isFirstSessionSelector,
  (isUserNotCoppaCompliant, isLoggedIn, isFirstSession) => !isUserNotCoppaCompliant && !isLoggedIn && isFirstSession,
);
