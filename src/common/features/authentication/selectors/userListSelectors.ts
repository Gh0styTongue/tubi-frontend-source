/**
 * Redux selectors for user list state.
 *
 * These selectors are separated from multipleAccounts.ts to avoid circular dependencies.
 * They don't depend on experimentV2, so they can be safely imported without triggering
 * experiment-related module loading.
 */
import flatMap from 'lodash/flatMap';
import { createSelector } from 'reselect';

import { FREEZED_EMPTY_ARRAY } from 'common/constants/constants';
import type { StoreState } from 'common/types/storeState';

const authSelector = ({ auth }: StoreState) => auth;

/** Selects the user list from auth state */
export const userListSelector = createSelector(authSelector, (auth) => auth.userList || FREEZED_EMPTY_ARRAY);

/**
 * Returns a flattened list of all users including kid accounts.
 * Used in the account picker to show all available accounts.
 */
export const flattenedUserListSelector = createSelector(userListSelector, (userList) => {
  if (userList.length === 0) {
    return userList;
  }
  return flatMap(userList, (user) => [user, ...(user.kids || FREEZED_EMPTY_ARRAY)]);
});

/** Returns true if any kid accounts exist in the user list */
export const hasKidsAccountSelector = createSelector(flattenedUserListSelector, (userList) =>
  userList.some((user) => 'parentTubiId' in user)
);
