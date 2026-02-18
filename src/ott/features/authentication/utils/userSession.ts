import { getLocalStorageData, removeLocalStorageData, setLocalStorageData } from '@adrise/utils/lib/localStorage';
import pick from 'lodash/pick';

import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import OTTFireTVAuthSessionMigration from 'common/experiments/config/ottFireTVAuthSessionMigration';
import OTTPs4AuthSessionMigration from 'common/experiments/config/ottPs4AuthSessionMigration';
import OTTSamsungAuthSessionMigration from 'common/experiments/config/ottSamsungAuthSessionMigration';
import OTTXboxoneAuthSessionMigration from 'common/experiments/config/ottXboxoneAuthSessionMigration';
import type { User } from 'common/features/authentication/types/auth';
import logger from 'common/helpers/logging';
import { trackLogging } from 'common/utils/track';
import { USER_SESSION_STORAGE_KEY } from 'ott/features/authentication/constants';

export interface UserSession extends Pick<User, 'authType' | 'hasAge' | 'refreshToken' | 'userId'> {
  accessToken: User['token'];
  createdAt?: number; // This field could be undefined because it was missing in the initial PR#20642
  updatedAt: number;
}

interface TrackUserSessionLoggingParams {
  loggerConfig?: {
    shouldSend?: boolean;
    data?: Record<string, unknown>;
  };
  message: string | number;
  sampleRate?: number;
  type?: string;
}

export const USER_SESSION_LOGGING_TYPES = {
  ERROR: 'error',
  LENGTH_IN_DAYS: 'lengthInDays',
};

const isUserSessionEnabled = () => __OTTPLATFORM__ && __CLIENT__;

export const trackUserSessionLogging = ({
  loggerConfig = {},
  message,
  sampleRate = 1,
  type = USER_SESSION_LOGGING_TYPES.ERROR,
}: TrackUserSessionLoggingParams) => {
  const { shouldSend: shouldSendToDatadog = true, data: loggerData } = loggerConfig;
  const subtype = [LOG_SUB_TYPE.USER_SESSION, type].join('@');
  const finalSampleRate = __PRODUCTION__ ? sampleRate : 1;

  if (Math.random() <= finalSampleRate) {
    trackLogging({
      type: TRACK_LOGGING.clientInfo,
      subtype,
      message,
    });

    if (type === USER_SESSION_LOGGING_TYPES.ERROR && shouldSendToDatadog) {
      const messageWithLabel = `userSession: ${message}`;

      if (loggerData) {
        logger.error(loggerData, messageWithLabel);
      } else {
        logger.error(messageWithLabel);
      }
    }
  }
};

// Why these fields are picked from the user object?
// See: https://www.notion.so/tubi/Sync-user-session-data-to-localStorage-10672557e92080ae87f7fb5becc931e1?pvs=4#4ec6559075f2420899bc48422a03e4ee
export const transformUserToUserSession = (user: User): UserSession => {
  const now = Date.now();

  return {
    ...pick(user, ['authType', 'hasAge', 'refreshToken', 'userId']),
    accessToken: user.token,
    createdAt: getUserSessionFromLocalStorage(false)?.createdAt || now,
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

export const getUserSessionFromLocalStorage = (isAuthSessionExperimentAvailable = true): UserSession | null => {
  if (!isUserSessionEnabled()) {
    return null;
  }

  if (isAuthSessionExperimentAvailable) {
    const ottFireTVAuthSessionMigration = OTTFireTVAuthSessionMigration();
    const ottPs4AuthSessionMigration = OTTPs4AuthSessionMigration();
    const ottSamsungAuthSessionMigration = OTTSamsungAuthSessionMigration();
    const ottXboxoneAuthSessionMigration = OTTXboxoneAuthSessionMigration();
    const isAuthSessionMigrationEnabled =
      ottFireTVAuthSessionMigration.getValue() ||
      ottPs4AuthSessionMigration.getValue() ||
      ottSamsungAuthSessionMigration.getValue() ||
      ottXboxoneAuthSessionMigration.getValue();

    ottFireTVAuthSessionMigration.logExposure();
    ottPs4AuthSessionMigration.logExposure();
    ottSamsungAuthSessionMigration.logExposure();
    ottXboxoneAuthSessionMigration.logExposure();

    if (!isAuthSessionMigrationEnabled) {
      return null;
    }
  }

  const jsonfiedUser = getLocalStorageData(USER_SESSION_STORAGE_KEY);

  if (!jsonfiedUser) {
    return null;
  }

  try {
    return JSON.parse(jsonfiedUser);
  } catch {
    trackUserSessionLogging({
      message: `Failed to parse user session: ${jsonfiedUser}`,
    });
    return null;
  }
};

export const removeUserSessionFromLocalStorage = () => removeLocalStorageData(USER_SESSION_STORAGE_KEY);

export const saveUserSessionToLocalStorage = (user: User) => {
  if (!isUserSessionEnabled()) {
    return;
  }

  const userSession = transformUserToUserSession(user);
  const isSuccess = setLocalStorageData(USER_SESSION_STORAGE_KEY, JSON.stringify(userSession));

  // It’s a known issue that COMCAST-like platforms (Comcast, Cox, Roger) do not support localStorage,
  // and we will fallback to the SecureStorage later. Meanwhile, we should also collect other platforms
  // that may not support localStorage for the further fallback.
  if (!isSuccess && !__IS_COMCAST_PLATFORM_FAMILY__) {
    trackUserSessionLogging({
      message: 'Failed to save user session to localStorage',
      loggerConfig: {
        shouldSend: false,
      },
    });
  }
};

export const updateUserSessionInLocalStorage = (updatedFields: Partial<UserSession>) => {
  const userSession = getUserSessionFromLocalStorage();

  if (!userSession) {
    return;
  }

  const updatedUserSession = {
    ...userSession,
    ...updatedFields,
    updatedAt: Date.now(),
  };

  const isSuccess = setLocalStorageData(USER_SESSION_STORAGE_KEY, JSON.stringify(updatedUserSession));

  if (!isSuccess) {
    trackUserSessionLogging({
      message: 'Failed to update user session in localStorage',
    });
  }
};
