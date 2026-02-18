/**
 * Helper functions for user session storage operations.
 * These functions are shared between localStorage and server storage adapters.
 */
import { getLocalStorageData, removeLocalStorageData, setLocalStorageData } from '@adrise/utils/lib/localStorage';
import jwtDecode from 'jwt-decode';
import pick from 'lodash/pick';

import { getCookieCrossPlatform } from 'client/utils/localDataStorage';
import { COOKIE_DEVICE_ID, IS_MULTIPLE_ACCOUNTS_SUPPORTED } from 'common/constants/constants';
import {
  USER_SESSION_STORAGE_KEY,
  USER_SESSION_FIELDS,
} from 'common/features/authentication/constants/auth';
import type { UserOrKid, DecodedUserToken, Kid, User } from 'common/features/authentication/types/auth';
import logger from 'common/helpers/logging';

import { removeItem } from './storage';
import { trackUserSessionLogging } from './track';
import type { UserSession } from './types';

export const isUserSessionAvailable = () => {
  return !!__OTTPLATFORM__ && __CLIENT__ && !__IS_COMCAST_PLATFORM_FAMILY__;
};

export const isUserListAvailable = () => {
  return isUserSessionAvailable() && IS_MULTIPLE_ACCOUNTS_SUPPORTED;
};

/**
 * This is a TEMPORARY copy of the exported function from @adrise/utils/lib/localStorage.
 * This version has added logs to track specific failure scenarios.
 * TODO: remove this and use the original export after investigation is complete.
 */
/* istanbul ignore next */
const supportsLocalStorage = (keys: string[] = ['getItem', 'setItem']) => {
  try {
    if (typeof window === 'undefined') {
      getCookieCrossPlatform(COOKIE_DEVICE_ID).then((deviceIdCookie) => {
        logger.error(
          {
            __CLIENT__,
            __SERVER__,
            deviceIdCookie,
          },
          'supportsLocalStorage is false - window is undefined'
        );
      });
      return false;
    }
    const isSupported = !!(window.localStorage && keys.every((key) => window.localStorage[key]));
    if (!isSupported) {
      getCookieCrossPlatform(COOKIE_DEVICE_ID).then((deviceIdCookie) => {
        logger.error(
          {
            deviceIdCookie,
          },
          'supportsLocalStorage is false - window.localStorage or keys are missing'
        );
      });
    }
    return isSupported;
  } catch (err) {
    getCookieCrossPlatform(COOKIE_DEVICE_ID).then((deviceIdCookie) => {
      logger.error(
        {
          error: err,
          deviceIdCookie,
        },
        'supportsLocalStorage is false - error occurred'
      );
    });
    return false;
  }
};

/**
 * Check if Redis/server storage should be used for user sessions.
 * Allow web and comcast platforms to operate user sessions in Redis.
 * @see https://app.shortcut.com/tubi/story/853466
 * @see https://app.shortcut.com/tubi/story/854313
 */
export const isRedisPermitted = () => {
  if (__WEBPLATFORM__ || __IS_COMCAST_PLATFORM_FAMILY__) {
    return true;
  }

  if (supportsLocalStorage()) {
    return false;
  }

  trackUserSessionLogging({
    message: 'localStorage is not supported when Redis is not permitted',
  });

  return true;
};

/**
 * Type guard to check if an item is a UserSession.
 * UserSession uses accessToken format, while User uses token format.
 * @see transformUserToUserSession for more context on accessToken vs token
 */
export function checkIsUserSession(item: UserSession | User): item is UserSession {
  return 'accessToken' in item && !('token' in item);
}

/**
 * Transform a User object to a UserSession for storage.
 * @see https://www.notion.so/tubi/Sync-user-session-data-to-localStorage-10672557e92080ae87f7fb5becc931e1?pvs=4#4ec6559075f2420899bc48422a03e4ee
 */
export const transformUserToUserSession = (user: UserOrKid, persistedValues: Partial<UserSession>): UserSession => {
  const now = Date.now();
  // passport.deserializeUser renames "accessToken" to "token". But _processUAPIAuthResponse uses "accessToken"
  // instead of the "token" field. Therefore, we need to check both for these compatibility and renaming issues.
  const accessToken = user.token || user.accessToken;

  let tubiId = user.tubiId;
  if (!tubiId) {
    try {
      tubiId = jwtDecode<DecodedUserToken>(accessToken || '').tubi_id;
    } catch (err) {
      logger.error({ err, user }, 'Failed to decode user token in transformUserToUserSession');
    }
  }

  return {
    ...pick(user, ['authType', 'hasAge', 'name', 'parentTubiId', 'refreshToken', 'userId']),
    accessToken,
    tubiId,
    // we should persist the `createdAt` value from the userSession in local storage if it exists
    createdAt: persistedValues.createdAt || now,
    updatedAt: now,
  };
};

/**
 * Transform a UserSession back to a User object.
 */
export const transformUserSessionToUser = (userSession: UserSession): User | Partial<Kid> => {
  const { accessToken: token } = userSession;

  let tubiId = userSession.tubiId;
  if (!tubiId) {
    try {
      tubiId = jwtDecode<DecodedUserToken>(token || '').tubi_id;
    } catch (err) {
      logger.error({ err, userSession }, 'Failed to decode user token in transformUserSessionToUser');
    }
  }

  return {
    ...pick(userSession, ['authType', 'hasAge', 'name', 'parentTubiId', 'refreshToken', 'userId']),
    token,
    tubiId,
  };
};

/**
 * Parse a user session from JSON storage string.
 * Handles error cases and invalid data gracefully.
 */
export const parseUserSessionFromStorage = (jsonifiedUser: string): UserSession | null => {
  try {
    const userSession = JSON.parse(jsonifiedUser);
    if (!userSession.tubiId) {
      try {
        userSession.tubiId = jwtDecode<DecodedUserToken>(userSession.accessToken || '').tubi_id;
      } catch (err) {
        logger.error({ err, userSession }, 'Failed to decode user token in parseUserSessionFromStorage');
      }
    }
    return userSession;
  } catch (error) {
    const debuggingData = {
      userAgent: typeof navigator !== 'undefined' && navigator.userAgent,
      jsonParseError: (error as Error)?.message || /* istanbul ignore next */ 'JSON.parse failed',
    } as Record<string, unknown>;

    // We received some jsonifiedUser values as "[object Object]", which leads me to think that
    // JSON.stringify may not be functioning properly on some Comcast devices. Therefore, I'm
    // adding additional data for debugging.
    if (jsonifiedUser === '[object Object]') {
      try {
        debuggingData.jsonStringify = JSON.stringify({
          testKey: 'testValue',
        });
      } catch (stringifyError) {
        debuggingData.jsonStringifyError = (stringifyError as Error)?.message || /* istanbul ignore next */ 'JSON.stringify failed';
      }
    } else if (jsonifiedUser === 'VGhpcyBub3QgYSByZWFsIHRva2VuLgo=') {
      // atob('VGhpcyBub3QgYSByZWFsIHRva2VuLgo=') = 'This not a real token.\n'.
      // Strange to see this string in logs. Actually, it's also shown up as an example in
      // https://rdkcentral.github.io/firebolt/apis/latest/manage/SecureStorage/.
      // A guess: it might be a placeholder for the device which doesn't support localStorage.
      const storageKey = 'testKey';
      const isSupportLocalStorage = setLocalStorageData(storageKey, 'testValue');

      /* istanbul ignore else */
      if (isSupportLocalStorage) {
        debuggingData.localStorageValue = getLocalStorageData(storageKey);
        removeLocalStorageData(storageKey);
      }

      debuggingData.isSupportLocalStorage = isSupportLocalStorage;
    }

    trackUserSessionLogging({
      message: `Failed to parse user session: ${jsonifiedUser}`,
      loggerConfig: {
        data: debuggingData,
      },
    });

    removeItem(USER_SESSION_STORAGE_KEY);

    return null;
  }
};

/**
 * Update session fields with validation.
 * Returns the updated session or null if no changes were made.
 */
export const updateSessionFields = (
  userSession: UserSession,
  updatedFields: Partial<UserSession>
): UserSession | null => {
  const validUpdatedFields = pick(updatedFields, USER_SESSION_FIELDS);
  const hasChanges = Object.keys(validUpdatedFields).some(
    (key) => validUpdatedFields[key as keyof UserSession] !== userSession[key as keyof UserSession]
  );

  if (!hasChanges) {
    return null;
  }

  const updatedUserSession = {
    ...userSession,
    ...validUpdatedFields,
    updatedAt: Date.now(),
  };

  if (!updatedUserSession.tubiId) {
    try {
      const decodedUserToken = jwtDecode<DecodedUserToken>(updatedUserSession.accessToken || '');
      updatedUserSession.tubiId = decodedUserToken.tubi_id;
    } catch (error) {
      logger.error(
        { error, userSession, updatedFields },
        'Failed to decode user token in updateSessionFields'
      );
    }
  }

  return updatedUserSession;
};

