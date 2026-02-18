import { ActionStatus, Manipulation, Messages } from '@tubitv/analytics/lib/authEvent';
import jwtDecode from 'jwt-decode';

import { addNotification } from 'common/actions/ui';
import { WEB_ROUTES } from 'common/constants/routes';
import {
  storeUserCredentials,
  removeUserCredentials,
  loginWithGoogle,
  handleCoppaError,
} from 'common/features/authentication/actions/auth';
import { COPPA_ERROR_STATUS_CODES, LOGIN_ERROR_CODES } from 'common/features/authentication/constants/auth';
import type { AUTH_ERROR_CODE } from 'common/features/authentication/constants/auth';
import { userCredentialsSelector, loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import type { AuthError, AuthThunk, EnhancedAgeGateData, User } from 'common/features/authentication/types/auth';
import { onActivateDeviceFlowFail } from 'common/features/authentication/utils/activateDevice';
import {
  isAuthServerError,
  redirectToAuthErrorPage,
} from 'common/features/authentication/utils/error';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import { trackAccountEvent } from 'common/utils/analytics';
import { GOOGLE_AUTH_FAILED } from 'web/components/TubiNotifications/notificationTypes';
import { handleAddAdultsAccountSuccess } from 'web/features/authentication/actions/multipleAccounts';
import { isAddAccountFlow, isCreateParentFlow } from 'web/features/authentication/utils/auth';

interface DecodedCredential {
  name: string;
  given_name: string;
  email: string;
}

type Credential = { idToken: string } | { code: string };

type ExtraParams = {
  selectBy?: string;
};

export const tryGoogleAuth = (credential: Credential, extra?: ExtraParams): AuthThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const user = await dispatch(loginWithGoogle(credential));
      await dispatch(handleGoogleAuthSuccess(user));
    } catch (error) {
      const location = tubiHistory.getCurrentLocation();
      const isAddingAccount = isAddAccountFlow(location);
      const isCreateParentAccount = isCreateParentFlow(location);

      if (error.status === 400 && LOGIN_ERROR_CODES.includes(error.code as AUTH_ERROR_CODE)) {
        let idToken;
        if ('idToken' in credential) {
          idToken = credential.idToken;
        } else {
          // for Google Button (OAuth2 flow), /v2/user/login returns recovery token
          idToken = error.token;
        }
        if (idToken) {
          try {
            const { given_name: firstName, email } = jwtDecode<DecodedCredential>(idToken);
            dispatch(storeUserCredentials({
              firstName,
              email,
              idToken,
            }));
            const nextPath = isAddingAccount ? (
              isCreateParentAccount ?
                WEB_ROUTES.addAccountCreateParentDetails :
                WEB_ROUTES.addAccountAdultDetails
            ) : WEB_ROUTES.register;
            tubiHistory.push({
              pathname: nextPath,
              state: extra,
            });
          } catch (err) {
            dispatch(handleGoogleAuthError(err, extra));
          }
          return;
        }
      }
      dispatch(handleGoogleAuthError(error, extra));
    }
  };
};

export const completeGoogleAuth = (data: EnhancedAgeGateData): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const userCredentials = userCredentialsSelector(state);
    if (!userCredentials?.idToken) {
      return;
    }
    try {
      const user = await dispatch(loginWithGoogle({
        idToken: userCredentials.idToken,
        ...data,
      }));
      dispatch(removeUserCredentials());
      await dispatch(handleGoogleAuthSuccess(user));
    } catch (error) {
      dispatch(handleGoogleAuthError(error, { selectBy: tubiHistory.getCurrentLocation().state?.selectBy }));
      throw error;
    }
  };
};

export const handleGoogleAuthSuccess = (user: User | void): AuthThunk<Promise<void>> => {
  return async (dispatch) => {
    const location = tubiHistory.getCurrentLocation();
    const isAddingAccount = isAddAccountFlow(location);
    // the success flow for single account login is already handled in loginWithGoogle
    if (isAddingAccount && user) {
      await dispatch(handleAddAdultsAccountSuccess(user));
    }
  };
};

const handleNonCoppaError = (error: AuthError, shouldHandleAuthError: boolean): AuthThunk<void> => {
  return (dispatch) => {
    let message;
    if (isAuthServerError(error) && shouldHandleAuthError) {
      message = Messages.AUTH_FAIL;
      redirectToAuthErrorPage(error, { type: 'signIn' });
    } else {
      message = Messages.AUTH_FAIL_WITH_FALLBACK;
      dispatch(addNotification(GOOGLE_AUTH_FAILED.notification, 'google-auth'));
    }
    trackAccountEvent({
      manip: Manipulation.SIGNIN,
      current: 'GOOGLE',
      message,
      status: ActionStatus.FAIL,
    });
  };
};

export const handleGoogleAuthError = (error: AuthError, extra: ExtraParams = {}): AuthThunk<void> => {
  return async (dispatch, getState) => {
    /**
     * When web users automatically sign in via OneTap, we don't need to redirect them to the auth error page on a 500 error.
     * https://developers.google.com/identity/gsi/web/reference/js-reference#select_by
     **/
    const { selectBy } = extra;
    const isAutoOneTap = selectBy && ['auto', 'fedcm_auto'].includes(selectBy);
    const shouldHandleAuthError = !isAutoOneTap;

    try {
      const { status } = error;
      onActivateDeviceFlowFail(error, loginRedirectSelector(getState(), { queryString: tubiHistory.getCurrentLocation().search }));
      if (COPPA_ERROR_STATUS_CODES.includes(status)) {
        await dispatch(handleCoppaError(error));
      } else {
        dispatch(handleNonCoppaError(error, shouldHandleAuthError));
      }
    } catch (e) {
      logger.error(e, 'Error in handleGoogleAuthError');
    }
  };
};
