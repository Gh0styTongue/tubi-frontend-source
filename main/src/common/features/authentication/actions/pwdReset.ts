import type { ThunkAction } from 'redux-thunk';

import * as actions from 'common/constants/action-types';
import { validateResetPasswordToken, updatePassword } from 'common/features/authentication/api/resetPassword';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import { actionWrapper } from 'common/utils/action';

export function verifyResetToken(token: string | number): TubiThunkAction<ThunkAction<Promise<void | Error>, any, any, any>> {
  return (dispatch: TubiThunkDispatch) => {
    dispatch(actionWrapper(actions.VERIFY_RESET_TOKEN, { token }));
    return dispatch(validateResetPasswordToken(token))
      .then((result) => {
        dispatch(
          actionWrapper(actions.VERIFY_RESET_TOKEN_SUCCESS, {
            userId: result.userId,
          }),
        );
        return Promise.resolve();
      })
      .catch((error) => {
        dispatch(
          actionWrapper(actions.VERIFY_RESET_TOKEN_FAIL, { error }),
        );
        return Promise.reject(error);
      });
  };
}

export function setPassword(token: string | number, password: string, userId: string): TubiThunkAction<ThunkAction<Promise<void>, any, any, any>> {
  return updatePassword({ token, password, userId });
}
