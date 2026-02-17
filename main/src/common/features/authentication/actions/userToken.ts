import * as actions from 'common/constants/action-types';
import { fetchTokenRefresh } from 'common/features/authentication/api/userToken';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type { User, AuthError, AuthThunk } from 'common/features/authentication/types/auth';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';

/**
 * retrieve a new access token for the logged in user, and attach to session
 * @note - the previous access token is still valid
 */
export const refreshToken = (): AuthThunk<Promise<User | void>> => {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    return dispatch(fetchTokenRefresh())
      .then((token?: User['token']) => {
        const { auth: { user } } = getState();
        if (token && user) {
          const updatedUser = {
            ...user as User,
            token,
          };
          dispatch(actionWrapper(actions.UPDATE_USER, { result: updatedUser }));
          return updatedUser;
        }
      })
      .catch((error: AuthError) => {
        const isLoggedIn = isLoggedInSelector(getState());

        // Update state to log out the user when the server returns a 403
        // https://github.com/adRise/www/blob/fcf90024031a8e3b4d35f234dc83e650c4d874c9/src/server/lib/refreshUserToken.ts#L85
        /* istanbul ignore else */
        if (isLoggedIn && error.status === 403) {
          dispatch(actionWrapper(actions.UPDATE_USER, { result: undefined }));
          dispatch(actionWrapper(actions.UNLOAD_HISTORY));
          dispatch(actionWrapper(actions.UNLOAD_QUEUE));
        }
      });
  };
};
