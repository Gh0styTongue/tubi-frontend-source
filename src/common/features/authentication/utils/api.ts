import type { AuthType } from '@tubitv/analytics/lib/baseTypes';

import getConfig from 'common/apiConfig';
import messages from 'common/features/authentication/api/messages';
import { saveUser } from 'common/features/authentication/api/user';
import { EXPIRED_ERROR_MESSAGE } from 'common/features/authentication/constants/auth';
import type { AuthError, AuthThunk, UAPIAuthResponse, User } from 'common/features/authentication/types/auth';
import { isAuthServerError, redirectToAuthErrorPage } from 'common/features/authentication/utils/error';
import logger from 'common/helpers/logging';
import { isMajorEventActiveSelector } from 'common/selectors/remoteConfig';
import { getClientUser } from 'common/utils/server';
import { REGENERATE_TOKEN_CODES } from 'common/utils/token';
import type { LanguageLocaleType } from 'i18n/constants';
import { getIntl } from 'i18n/intl';

const { uapi } = getConfig();

type AuthCallbackError = {
  originalError?: AuthError;
  message?: string;
  name?: string;
  statusCode?: number;
};

interface AuthCallbackParams {
  error?: AuthCallbackError;
  user?: User;
  additionalLog?: { message?: string };
  userLanguageLocale: LanguageLocaleType;
  isMajorEventActive?: boolean;
  shouldHandleAuthError?: boolean;
}

export type UserOrPending = User | { status: 'pending' };
type AuthCallback<T extends (UserOrPending | void) = User> = (opts: AuthCallbackParams) => AuthThunk<Promise<T>>;

// Tubi API docs for reference:
// Magic Link Status - https://docs.tubi.io/api_docs/account#operations-Device-get-magic-link
// OTT Activation Status - https://docs.tubi.io/api_docs/account#operations-Device-post-user_device-code-status
const isAuthStatusPending = (url: string, status: string | undefined) => {
  const isAuthStatusUrl = [uapi.magicLink, uapi.registrationLink, uapi.codeStatus].some((endpoint) =>
    url.startsWith(endpoint)
  );
  const isPending = status && status.toLowerCase() === 'pending';
  return isAuthStatusUrl && isPending;
};

// Tubi API docs for reference:
// Magic Link Status - https://docs.tubi.io/api_docs/account#operations-Device-get-magic-link
// OTT Activation Status - https://docs.tubi.io/api_docs/account#operations-Device-post-user_device-code-status
const isAuthStatusExpired = (url: string, status: string | undefined) => {
  const isAuthStatusUrl = [uapi.magicLink, uapi.registrationLink, uapi.codeStatus].some((endpoint) => url.startsWith(endpoint));
  const isExpired = status && status.toLowerCase() === 'expired';
  return isAuthStatusUrl && isExpired;
};

/**
 * Callback for handling login API responses
 * was passportCallbacks.login (from src/server/passport/authenticateCallbacks.ts)
 */
export const loginCallback: AuthCallback<User> = ({
  error,
  user,
  additionalLog,
  userLanguageLocale,
  isMajorEventActive = false,
  shouldHandleAuthError = true,
}) => {
  return async (dispatch) => {
    const intl = getIntl(userLanguageLocale);

    if (error) {
      logger.info(error, 'Error in Login');
      /* istanbul ignore next */
      const { originalError: { code, httpCode } = {}, statusCode } = error;
      if (REGENERATE_TOKEN_CODES.some((c) => c === code)) {
        logger.info(error, 'Login token error');
        return Promise.reject({
          code,
          status: /* istanbul ignore next */ httpCode || statusCode,
        });
      }
      if (statusCode === 403 || statusCode === 400) {
        // email doesn't exist, or email was correct but password was not.
        return Promise.reject({
          message: intl.formatMessage(messages.invalid),
          status: statusCode,
        });
      }
      logger.info(error, 'Error in Login. We handle this as a default err');

      const { originalError } = error;
      if (originalError && isAuthServerError(originalError, isMajorEventActive) && shouldHandleAuthError) {
        redirectToAuthErrorPage(originalError, { type: 'signIn' });
      }

      return Promise.reject({
        message: intl.formatMessage(messages.unknown),
        status: statusCode,
      });
    }

    if (!user) {
      logger.error(additionalLog, 'No user was found on login when there is no error');
      return Promise.reject({
        message: intl.formatMessage(messages.unknown),
        status: 400,
      });
    }

    await dispatch(saveUser(user, intl, 'signIn', shouldHandleAuthError));

    return getClientUser({
      ...user,
      token: user.accessToken,
    });
  };
};

// Used in getMagicLinkStatus
export const magicLinkCallback: AuthCallback<UserOrPending> = ({
  error,
  user,
  userLanguageLocale,
}) => {
  return async (dispatch) => {
    const intl = getIntl(userLanguageLocale);

    if (error) {
      if (error.message === EXPIRED_ERROR_MESSAGE) {
        logger.info('Magic link status expired');
        return Promise.reject({ message: 'magic link status expired', statusCode: 404 });
      }
      if (error.statusCode === 404) {
        logger.error(error, 'Magic link UID not found');
        return Promise.reject({ message: 'magic link not found', statusCode: 404 });
      }
      return Promise.reject(error.originalError);
    }

    if (!user) {
      return { status: 'pending' };
    }

    await dispatch(saveUser(user, intl, 'magicLink'));

    return getClientUser({
      ...user,
      token: user.accessToken,
    });
  };
};

// Used in loginWithMagicLinkFromEmail
export const magicLinkFromEmailCallback: AuthCallback<void> = ({
  error,
  user,
  userLanguageLocale,
}) => {
  return (dispatch) => {
    const intl = getIntl(userLanguageLocale);
    if (error) {
      if (error.statusCode === 404) {
        logger.error(error, 'Magic link UID not found');
        return Promise.reject({ message: 'magic link not found', statusCode: 404 });
      }

      const { originalError } = error;
      return Promise.reject(originalError);
    }

    if (!user) {
      return Promise.reject({ message: 'internal issue', statusCode: 500 });
    }

    return dispatch(saveUser(user, intl, 'magicLink'));
  };
};

export const registrationLinkCallback: AuthCallback<UserOrPending> = ({
  error,
  user,
  userLanguageLocale,
}) => {
  return async (dispatch) => {
    const intl = getIntl(userLanguageLocale);

    if (error) {
      if (error.message === EXPIRED_ERROR_MESSAGE) {
        logger.info('Registration link status expired');
        return Promise.reject({ message: 'registration link status expired', statusCode: 404 });
      }
      if (error.statusCode === 404) {
        logger.error(error, 'Registration link UID not found');
        return Promise.reject({ message: 'registration link not found', statusCode: 404 });
      }

      if (error.statusCode === 422) {
        logger.info(error, 'User is below minimum age requirement on signup by registration link');
        return Promise.reject({ message: 'below min age', statusCode: 422 });
      }

      if (error.statusCode === 451) {
        logger.info(error, 'Unavailable for legal reasons on signup by registration link');
        return Promise.reject({ message: 'legal', statusCode: 451 });
      }

      return Promise.reject(error.originalError);
    }

    if (!user) {
      return { status: 'pending' };
    }

    await dispatch(saveUser(user, intl, 'magicLink'));

    return getClientUser({
      ...user,
      token: user.accessToken,
    });
  };
};

export const activationCodeCallback: AuthCallback<UserOrPending> = ({
  error,
  user,
  userLanguageLocale,
}) => {
  return async (dispatch) => {
    const intl = getIntl(userLanguageLocale);

    if (error) {
      const { message, originalError } = error;
      if (message === EXPIRED_ERROR_MESSAGE) {
        logger.info('Activation code status expired');
        return Promise.reject({ message });
      }
      return Promise.reject(originalError);
    }

    if (!user) {
      return { status: 'pending' };
    }

    await dispatch(saveUser(user, intl, 'activate'));

    return getClientUser(user);
  };
};

export const transferUserCallback: AuthCallback<User> = ({
  error,
  user,
  userLanguageLocale,
}) => {
  return async (dispatch) => {
    const intl = getIntl(userLanguageLocale);

    if (error) {
      logger.error(error, 'Error during Transfer User');
      const { originalError } = error;
      return Promise.reject(originalError);
    }

    if (!user) {
      logger.error('No user data returned during Transfer User');
      return Promise.reject({
        message: 'no user data',
        status: 400,
      });
    }

    await dispatch(saveUser(user, intl, 'signIn', false));

    return getClientUser(user);
  };
};

/**
 * Helper function that deals with the common auth response from the UAPI
 * (from src/server/auth.ts)
 */
export const processUAPIAuthResponse = <T extends (UserOrPending | void)>({
  authType,
  callback,
  response,
  url,
}: {
  authType: AuthType;
  callback: AuthCallback<T>;
  response: UAPIAuthResponse;
  url: string;
}): AuthThunk<Promise<T>> => {
  return (dispatch, getState) => {
    const state = getState();
    const {
      ui: { userLanguageLocale },
    } = state;
    const {
      user_id: userId,
      access_token: accessToken,
      name,
      first_name,
      email,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      status,
      has_password: hasPassword,
      has_age: hasAge,
    } = response;

    // Handle expired status requests used by our polling strategy for magic link
    if (isAuthStatusExpired(url, status)) {
      return dispatch(callback({ error: { message: EXPIRED_ERROR_MESSAGE }, userLanguageLocale }));
    }

    // Handle pending status requests used by our polling strategy for magic link and OTT activation code
    if (isAuthStatusPending(url, status)) {
      return dispatch(callback({ userLanguageLocale }));
    }

    // Handle missing user data
    if (!userId || !accessToken) {
      logger.info({ response, url }, 'Login failed without throwing any errors');
      return dispatch(
        callback({
          additionalLog: { message: 'Error missing necessary user data.' },
          userLanguageLocale,
        })
      );
    }

    const user = {
      userId,
      name,
      first_name,
      email,
      accessToken,
      refreshToken,
      expiresIn,
      status,
      hasPassword,
      authType,
      hasAge,
    };
    return dispatch(callback({ user, userLanguageLocale }));
  };
};

/**
 * Helper function that deals with the common error responses from the UAPI
 * (from src/server/auth.ts)
 */
export const processUAPIAuthError = <T extends (UserOrPending | void) = User>({
  authType,
  callback,
  err,
}: {
  authType: AuthType;
  err: AuthError;
  callback: AuthCallback<T>;
}): AuthThunk<Promise<T>> => {
  return (dispatch, getState) => {
    const state = getState();
    const {
      ui: { userLanguageLocale },
    } = state;
    const { status: statusCode } = err;
    const errorName = (err && 'name' in err ? err.name : null) || 'AuthError';
    const errorInfo = {
      authType,
      errorMessage: err.message,
      name: errorName,
      originalError: err,
      statusCode,
    };

    if (statusCode === 400) {
      return dispatch(
        callback({
          error: { ...errorInfo, message: 'arguments do not pass the validators' },
          userLanguageLocale,
        })
      );
    }
    if (statusCode === 403) {
      return dispatch(
        callback({
          error: { ...errorInfo, message: 'Invalid Credentials' },
          userLanguageLocale,
        })
      );
    }

    const isMajorEventActive = isMajorEventActiveSelector(state);
    if (statusCode === 500) {
      return dispatch(
        callback({
          error: { ...errorInfo, message: '500 Error: Internal issue' },
          isMajorEventActive,
          userLanguageLocale,
        })
      );
    }

    // for all other errors lets use the logger so we pay a closer attention to it
    const errorMessage = `_processUAPIAuthResponse: ${
      (err && 'message' in err ? err.message : null) || 'Unknown error'
    }`;

    const severity = statusCode < 500 ? 'info' : 'error';
    logger[severity](errorInfo, errorMessage);

    return dispatch(
      callback({
        error: { originalError: err, statusCode, message: errorMessage, name: errorName },
        isMajorEventActive,
        userLanguageLocale,
      })
    );
  };
};
