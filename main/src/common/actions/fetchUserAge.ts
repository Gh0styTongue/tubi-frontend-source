import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { fetchBirthdayInfo } from 'common/api/checkBirthdayInfo';
import type { AuthError } from 'common/features/authentication/types/auth';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import type ApiClient from 'common/helpers/ApiClient';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { updateUserSessionInLocalStorage } from 'ott/features/authentication/utils/userSession';

import { setUserCoppaState } from './userSettings';

export function fetchUserAge(): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    const {
      auth: { user },
    } = getState();

    if (!user) {
      return Promise.resolve();
    }

    if (user.hasAge) {
      setUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
      return Promise.resolve();
    }

    // Since this request is blocking initial render, client will abort the request and age-gate user
    // when deadline or timeout is reached.
    const options = { deadline: 8000, timeout: 4000 };

    return fetchBirthdayInfo(dispatch, options)
      .then((response) => {
        if (response.has_age) {
          // User is 13 years old or older
          setUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
          updateUserSessionInLocalStorage({ hasAge: true });
        } else {
          // User age is unknown, user needs to be age-gated
          setUserCoppaState(dispatch, UserCoppaStates.REQUIRE_AGE_GATE);
        }
      })
      .catch((error: AuthError) => {
        if (error.status === 422) {
          // Unprocessable Entity. User is below 13 years old
          setUserCoppaState(dispatch, UserCoppaStates.NOT_COMPLIANT);
        } else if (error.status === 451 || error.status === 404) {
          // Unavailable For Legal Reasons. User too young (non-US users), needs to be logged out for legal reasons
          // 404 can happen when user account has been deleted on the back-end
          setUserCoppaState(dispatch, UserCoppaStates.REQUIRE_LOGOUT);
        } else {
          // Unknown age, user needs to be age-gated
          setUserCoppaState(dispatch, UserCoppaStates.REQUIRE_AGE_GATE);
          return Promise.reject(error);
        }
      });
  };
}
