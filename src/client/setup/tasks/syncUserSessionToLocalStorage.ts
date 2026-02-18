import { LOAD_AUTH_SUCCESS } from 'common/constants/action-types';
import { userSelector } from 'common/features/authentication/selectors/auth';
import type { User } from 'common/features/authentication/types/auth';
import type { TubiStore } from 'common/types/storeState';
import { actionWrapper } from 'common/utils/action';
import { timeDiffInDays } from 'common/utils/date';
import {
  USER_SESSION_LOGGING_TYPES,
  getUserSessionFromLocalStorage,
  removeUserSessionFromLocalStorage,
  saveUserSessionToLocalStorage,
  trackUserSessionLogging,
  transformUserSessionToUser,
} from 'ott/features/authentication/utils/userSession';

// TODO: This function is temporarily used to sync user session data to localStorage. Once all auth-related
// code has been migrated to use common/features/authentication/api/user.ts, this function should be removed.
// Especially after the completion of https://app.shortcut.com/tubi/story/775606.
export const syncUserSessionToLocalStorage = (store: TubiStore) => {
  const state = store.getState();
  const user = userSelector(state);
  const userSession = getUserSessionFromLocalStorage();

  const shouldNotSyncConditions = [userSession && !user, userSession && user && userSession.userId === user.userId];
  const shouldNotSync = shouldNotSyncConditions.some((condition) => condition);

  if (shouldNotSync) {
    return;
  }

  if (userSession && user && userSession.userId !== user.userId) {
    trackUserSessionLogging({
      message: `userId mismatch: ${userSession.userId} !== ${user.userId}`,
      loggerConfig: {
        data: {
          userSession,
        },
      },
    });
  }

  if (user) {
    // TODO: the type casting can be removed once we fix the auth.user type
    saveUserSessionToLocalStorage(user as User);
  } else {
    // This removal is still necessary for platforms that haven't yet migrated to the localStorage-based user
    // session, as we are following a gradual migration approach. Once all platforms have been migrated, this
    // can be cleaned up.
    removeUserSessionFromLocalStorage();
  }
};

export const trackUserSessionLengthInDays = () => {
  const userSession = getUserSessionFromLocalStorage(false);

  if (userSession) {
    trackUserSessionLogging({
      type: USER_SESSION_LOGGING_TYPES.LENGTH_IN_DAYS,
      message: timeDiffInDays(new Date(), new Date(userSession.createdAt || userSession.updatedAt)),
    });
  }
};

export const initUserSession = (store: TubiStore) => {
  syncUserSessionToLocalStorage(store);

  const userSession = getUserSessionFromLocalStorage();

  if (userSession) {
    store.dispatch(
      actionWrapper(LOAD_AUTH_SUCCESS, {
        result: transformUserSessionToUser(userSession),
      })
    );
  }
};
