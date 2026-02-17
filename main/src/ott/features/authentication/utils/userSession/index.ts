import {
  getLocalStorageData,
  removeLocalStorageData,
  setLocalStorageData,
  supportsLocalStorage,
} from '@adrise/utils/lib/localStorage';
import pick from 'lodash/pick';

import type { User } from 'common/features/authentication/types/auth';
import { USER_SESSION_STORAGE_KEY, USER_SESSION_FIELDS } from 'ott/features/authentication/constants';

import { setItem, getItem, removeItem } from './storage';
import { trackUserSessionLogging } from './track';

export { USER_SESSION_LOGGING_TYPES } from './track';

export { trackUserSessionLogging };

export interface UserSession extends Pick<User, 'accessToken' | 'authType' | 'hasAge' | 'refreshToken' | 'userId'> {
  createdAt?: number; // This field could be undefined because it was missing in the initial PR#20642
  updatedAt: number;
}

export const isUserSessionAvailable = () => !!__OTTPLATFORM__ && __CLIENT__ && !__IS_COMCAST_PLATFORM_FAMILY__;

// Allow web and comcast platforms to operate user sessions in Redis. The reason can be found in the story
// description: https://app.shortcut.com/tubi/story/853466. Please note that the check should be applied to
// both read and write operations. Otherwise, it may lead to issues caused by mismatched logged-in statuses,
// as described in https://app.shortcut.com/tubi/story/854313.
export const isRedisPermitted = () => {
  if (__WEBPLATFORM__ || __IS_COMCAST_PLATFORM_FAMILY__) {
    return true;
  }

  if (supportsLocalStorage()) {
    return false;
  }

  trackUserSessionLogging({
    message: 'localStorage is not supported when Redis is not permitted',
    sampleRate: 0.1,
  });

  return true;
};

// Why these fields are picked from the user object?
// See: https://www.notion.so/tubi/Sync-user-session-data-to-localStorage-10672557e92080ae87f7fb5becc931e1?pvs=4#4ec6559075f2420899bc48422a03e4ee
export const transformUserToUserSession = async (user: User): Promise<UserSession> => {
  const now = Date.now();

  return {
    ...pick(user, ['authType', 'hasAge', 'refreshToken', 'userId']),
    // passport.deserializeUser renames "accessToken" to "token". But _processUAPIAuthResponse uses "accessToken"
    // instead of the "token" field. Therefore, we need to check both for these compatibility and renaming issues.
    accessToken: user.token || user.accessToken,
    createdAt: (await getUserSessionFromLocalStorage())?.createdAt || now,
    updatedAt: now,
  };
};

export const transformUserSessionToUser = (userSession: UserSession): User => {
  const { accessToken: token } = userSession;

  return {
    ...pick(userSession, ['authType', 'authType', 'hasAge', 'refreshToken', 'userId']),
    token,
  };
};

export const getUserSessionFromLocalStorage = async (): Promise<UserSession | null> => {
  if (!isUserSessionAvailable()) {
    return null;
  }

  const jsonfiedUser = await getItem(USER_SESSION_STORAGE_KEY);

  if (!jsonfiedUser) {
    return null;
  }

  try {
    return JSON.parse(jsonfiedUser);
  } catch (error) {
    const debuggingData = {
      userAgent: typeof navigator !== 'undefined' && navigator.userAgent,
      jsonParseError: error?.message || /* istanbul ignore next */ 'JSON.parse failed',
    } as Record<string, unknown>;

    // We received some jsonfiedUser values as "[object Object]", which leads me to think that
    // JSON.stringify may not be functioning properly on some Comcast devices. Therefore, I’m
    // adding additional data for debugging.
    if (jsonfiedUser === '[object Object]') {
      try {
        debuggingData.jsonStringify = JSON.stringify({
          testKey: 'testValue',
        });
      } catch (error) {
        debuggingData.jsonStringifyError = error?.message || /* istanbul ignore next */ 'JSON.stringify failed';
      }
    } else if (jsonfiedUser === 'VGhpcyBub3QgYSByZWFsIHRva2VuLgo=') {
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
      message: `Failed to parse user session: ${jsonfiedUser}`,
      loggerConfig: {
        data: debuggingData,
      },
    });

    removeItem(USER_SESSION_STORAGE_KEY);

    return null;
  }
};

export const removeUserSessionFromLocalStorage = () => removeItem(USER_SESSION_STORAGE_KEY);

export const saveUserSessionToLocalStorage = async (user: User) => {
  if (!isUserSessionAvailable()) {
    return;
  }

  const userSession = await transformUserToUserSession(user);
  const isSuccess = await setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(userSession));

  if (!isSuccess) {
    trackUserSessionLogging({
      message: 'Failed to save user session to localStorage',
      loggerConfig: {
        shouldSend: false,
      },
    });
  }
};

export const updateUserSessionInLocalStorage = async (updatedFields: Partial<UserSession>) => {
  const userSession = await getUserSessionFromLocalStorage();

  if (!userSession) {
    return;
  }

  const validUpdatedFields = pick(updatedFields, USER_SESSION_FIELDS);
  const hasChanges = Object.keys(validUpdatedFields).some((key) => validUpdatedFields[key] !== userSession[key]);

  if (!hasChanges) {
    return;
  }

  const updatedUserSession = {
    ...userSession,
    ...validUpdatedFields,
    updatedAt: Date.now(),
  };

  const isSuccess = await setItem(USER_SESSION_STORAGE_KEY, JSON.stringify(updatedUserSession));

  if (!isSuccess) {
    trackUserSessionLogging({
      message: 'Failed to update user session in localStorage',
    });
  }
};
