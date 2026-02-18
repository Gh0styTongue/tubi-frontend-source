import { createSelector } from 'reselect';

import { getExperiment } from 'common/experimentV2';
import { ottFireTVMultipleAccountsPhase2 } from 'common/experimentV2/configs/ottFireTVMultipleAccountsPhase2';
import { flattenedUserListSelector, userListSelector } from 'common/features/authentication/selectors/auth';

// if a user was previously in a treatment group and created multiple accounts,
// then they should still be able to access the multiple accounts feature
export const isMultipleAccountsEnabledSelector = createSelector(
  flattenedUserListSelector,
  (userList) => {
    try {
      // TODO this is calling too early to pull the experiment results in some cases
      // which throws a runtime exception that the experiment client is not initialized
      const isEnableMultipleAccounts = getExperiment(ottFireTVMultipleAccountsPhase2, { disableExposureLog: true }).get(
        'enable_multiple_accounts'
      );
      if (isEnableMultipleAccounts) {
        return true;
      }
    } catch {
      // fall through to default case
    }
    const hasMultipleAccounts = userList.length >= 2;
    return hasMultipleAccounts;
  },
);

// if a user was previously in a treatment group and created a kid account,
// then they should still be able to access the kid account feature
export const isKidAccountEnabledSelector = createSelector(
  userListSelector,
  (userList) => {
    try {
      // TODO this is calling too early to pull the experiment results in some cases
      // which throws a runtime exception that the experiment client is not initialized
      const isEnableKidAccounts = getExperiment(ottFireTVMultipleAccountsPhase2, { disableExposureLog: true }).get(
        'enable_kid_accounts'
      );
      if (isEnableKidAccounts) {
        return isEnableKidAccounts;
      }
    } catch {
      // fall through to default case
    }
    const hasKids = userList.some(user => user.kids?.length);
    return hasKids;
  },
);
