import { ONE_HOUR } from 'common/constants/constants';
import { refreshToken } from 'common/features/authentication/actions/userToken';
import type { User } from 'common/features/authentication/types/auth';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import {
  getExpirationFromToken,
  isValidTokenDate,
} from 'common/utils/token';

const ONE_HOUR_IN_SECONDS = ONE_HOUR / 1000;

export const getUserToken = async (user: User, dispatch: TubiThunkDispatch) => {
  const { token } = user;
  let tokenIsValid = false;

  if (token) {
    const exp = getExpirationFromToken(token);
    tokenIsValid = isValidTokenDate(Number(exp), ONE_HOUR_IN_SECONDS);
  }

  if (!tokenIsValid) {
    const result = await dispatch(refreshToken());
    return result?.token;
  }

  return token;
};
