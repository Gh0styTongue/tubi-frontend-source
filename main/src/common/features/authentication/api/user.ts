import type { IntlShape } from 'react-intl';

import messages from 'common/features/authentication/api/messages';
import type { AuthErrorLocationState, AuthThunk, User } from 'common/features/authentication/types/auth';
import { isAuthServerError, redirectToAuthErrorPage } from 'common/features/authentication/utils/error';
import logger from 'common/helpers/logging';
import { isMajorEventActiveSelector } from 'common/selectors/remoteConfig';
import {
  isRedisPermitted,
  removeUserSessionFromLocalStorage,
  saveUserSessionToLocalStorage,
  updateUserSessionInLocalStorage,
} from 'ott/features/authentication/utils/userSession';

type VoidThunkPromise = AuthThunk<Promise<void>>;

const retryOptions = {
  retryCount: 2,
  retryScalingDuration: 1000,
};

// saveUser, updateUser, and logoutUser must all use the connected instance of ApiClient so that token
// requests sent during SSR can access the original req object (for forwarding cookies, headers, etc.).
export const saveUser = (
  user: User,
  intl: IntlShape,
  type: AuthErrorLocationState['type'],
  shouldHandleAuthError = true
): VoidThunkPromise => {
  return async (_dispatch, getState, connectedClient) => {
    try {
      await saveUserSessionToLocalStorage(user);

      if (isRedisPermitted()) {
        await connectedClient.post('/oz/user', {
          data: { ...user },
          ...retryOptions,
          retryExcludedStatusCodes: [400, 403],
        });
      }
    } catch (err) {
      logger.error({ status: err.status, message: err.message, user }, 'POST /oz/user failed - unable to save user');

      if (isAuthServerError(err, isMajorEventActiveSelector(getState())) && shouldHandleAuthError) {
        redirectToAuthErrorPage(err, { type });
      }

      // Return the error since other requests that require the token in Redis on the proxy server will fail.
      // TODO: remove this once all routes that require tokens from Redis have been migrated off the proxy
      // server in order to unblock the login flow and allow users to browse for a single session.
      return Promise.reject({
        message: intl.formatMessage(messages.unknown),
        status: err.status,
      });
    }
  };
};

export const updateUser = (partialUser: Partial<User>, intl: IntlShape): VoidThunkPromise => {
  return async (_dispatch, _getState, connectedClient) => {
    try {
      await updateUserSessionInLocalStorage(partialUser);

      if (isRedisPermitted()) {
        const updatedUser = await connectedClient.patch('/oz/user', {
          data: { ...partialUser },
          ...retryOptions,
          retryExcludedStatusCodes: [400],
        });
        await saveUserSessionToLocalStorage(updatedUser);
      }
    } catch (err) {
      logger.error(
        { status: err.status, message: err.message, partialUser },
        'PATCH /oz/user failed - unable to update user'
      );

      // Return the error since other requests that require the token in Redis on the proxy server will fail.
      // TODO: remove this once all routes that require tokens from Redis have been migrated off the proxy
      // server in order to unblock the login flow and allow users to browse for a single session.
      return Promise.reject({
        message: intl.formatMessage(messages.unknown),
        status: err.status,
      });
    }
  };
};

interface LogoutData {
  intentional: boolean;
}

export const logoutUser = (user: User, data: LogoutData): VoidThunkPromise => {
  return async (_dispatch, _getState, connectedClient) => {
    const { intentional } = data;

    try {
      await removeUserSessionFromLocalStorage();

      if (isRedisPermitted()) {
        await connectedClient.post('/oz/user/logout', {
          data: { intentional },
          ...retryOptions,
        });
      }
    } catch (err) {
      logger.info(
        { status: err.status, message: err.message, user },
        'POST /oz/user/logout failed - unable to logout user'
      );
      return Promise.reject(err);
    }
  };
};
