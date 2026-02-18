import { setCookie, setLocalData } from 'client/utils/localDataStorage';
import {
  AUTH_ERROR_TIMESTAMP_KEY,
  AUTH_ERROR_EXPIRY_DURATION_IN_SEC,
  COOKIE_REDIRECT_URL,
} from 'common/constants/constants';
import { fetchEmailAvailable } from 'common/features/authentication/api/auth';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { RouteCode } from 'common/types/route-codes';

export const checkIfEmailExists = (email: string, dispatch: TubiThunkDispatch) => new Promise<boolean>((resolve, reject) => {
  return dispatch(fetchEmailAvailable(email))
    .then(({ code }: { code: RouteCode }) => {
      resolve(code === 'TAKEN');
    }).catch((error) => {
      reject(error);
    });
});

export function attachRedirectCookie(loginRedirect: string) {
  setCookie(
    COOKIE_REDIRECT_URL,
    loginRedirect,
    5 * 60, // 5 min is enough any longer and it might become a bad redirect at later point
  );
}

/**
 * Update local storage to track the last auth error
 * The value is the current UTC timestamp in ISO format
 */
export const saveAuthErrorTimestamp = () => {
  const currentTime = new Date().toISOString();
  setLocalData(AUTH_ERROR_TIMESTAMP_KEY, currentTime, AUTH_ERROR_EXPIRY_DURATION_IN_SEC);
};
