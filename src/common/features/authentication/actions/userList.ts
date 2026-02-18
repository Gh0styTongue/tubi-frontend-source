import getConfig from 'common/apiConfig';
import * as actions from 'common/constants/action-types';
import { AUTH_ENDPOINT_TIMEOUT_MS } from 'common/features/authentication/constants/auth';
import type { AuthThunk, User } from 'common/features/authentication/types/auth';
import { isUserNotFound } from 'common/features/authentication/utils/user';
import { deviceIdSelector } from 'common/selectors/deviceId';
import type { UAPIUserSettingsResponse } from 'common/types/userSettings';
import { getPlatform } from 'common/utils/platform';
import type { UserSession } from 'ott/features/authentication/utils/userSession';
import {
  addUserSessionToUserList,
  getUserSessionFromLocalStorage,
  getUserListFromLocalStorage,
  removeUserSessionFromLocalStorage,
  transformUserSessionToUser,
  transformUserToUserSession,
  updateUserListInLocalStorage,
} from 'ott/features/authentication/utils/userSession';

const config = getConfig();
const { uapi } = config;

// Custom refreshUserToken function for use with Multiple Accounts MVP.
// If the refresh token API returns a 401/403, we should remove the user from local storage
// without logging out the primary user.
// All other token requests should use the functions defined in src/common/actions/fetch.ts
const refreshUserToken = (user: User): AuthThunk<Promise<User | null>> => {
  return async (_dispatch, getState, client) => {
    try {
      const refreshResponse = await client.post(uapi.refresh, {
        data: {
          platform: getPlatform(),
          device_id: deviceIdSelector(getState()),
        },
        headers: {
          Authorization: `Bearer ${user.refreshToken}`,
        },
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      });
      const newToken = refreshResponse?.access_token;
      if (newToken) {
        const newUser = { ...user, token: newToken };
        return newUser;
      }
      return user;
    } catch (err) {
      // If the refresh token API returns a 401/403, return null
      if ([401, 403].includes(err.status)) {
        return null;
      }
      // For all other errors, return the original user object so we do not unintentionally log users out
      return user;
    }
  };
};

// A custom userSettings API request for use with Multiple Accounts MVP.
// If the userSettings API returns a 401 USER_NOT_FOUND error, we should remove the user from
// local storage without logging out the primary user.
// All other userSettings requests should use the functions defined in src/common/actions/userSettings.ts
export const fetchUserName = (user: User): AuthThunk<Promise<User | null>> => {
  return async (dispatch, _getState, client) => {
    let isValidUser = true;
    try {
      const newUser = { ...user };
      const settings: UAPIUserSettingsResponse = await client.get(uapi.userSettings, {
        allowParallelTokenRefresh: true,
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        refreshUserToken: async () => {
          const refreshedUser = await dispatch(refreshUserToken(user));
          if (refreshedUser) {
            newUser.token = refreshedUser.token;
            return refreshedUser;
          }
          isValidUser = false;
        },
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      });
      return {
        ...newUser,
        name: settings.first_name,
      };
    } catch (err) {
      // Mimic the handleUserNotFound logic to log the user out from src/common/actions/fetch.ts
      if (isUserNotFound(err.status, err.code)) {
        return null;
      }
      // If refreshUserToken returned null, we should log the user out
      if (!isValidUser) {
        return null;
      }
      // For all other errors, return the original user object so we do not unintentionally log users out
      return user;
    }
  };
};

export const fetchAndFilterUsers = (userList: UserSession[]): AuthThunk<Promise<User[]>> => {
  return async (dispatch) => {
    const users = userList.map(transformUserSessionToUser);
    const results = await Promise.all(users.map(user => dispatch(fetchUserName(user))));

    // Return valid users
    return results.filter(user => user !== null) as User[];
  };
};

export const loadUserList = ():AuthThunk<Promise<void>> => {
  return async (dispatch) => {
    // Read the user data from local storage
    const [userSession, userSessionList] = await Promise.all([
      getUserSessionFromLocalStorage(),
      getUserListFromLocalStorage(),
    ]);

    // Return early if userSession and userSessionList are empty in local storage
    if (!userSession && userSessionList.length === 0) {
      return;
    }

    // Init the userSessionList if it doesn't exist in local storage
    let userList = userSessionList;
    if (userSession && userList.length === 0) {
      await addUserSessionToUserList(userSession);
      userList = [userSession];
    }

    // Load user names and filter out any users that are not valid (accounts have been deleted)
    const verifiedUsers = await dispatch(fetchAndFilterUsers(userList));

    // Transform the verified users into userSession objects and update local storage
    const newUserList = verifiedUsers.map(user => {
      const existingUserSession = userList.find(u => u.userId === user.userId);
      const newUserSession = transformUserToUserSession(user, { createdAt: existingUserSession?.createdAt });
      return newUserSession;
    });
    const localStoragePromises: Promise<unknown>[] = [
      updateUserListInLocalStorage(newUserList),
    ];

    // Clear the current userSession if it was deleted from the userSessionList
    if (userSession && !newUserList.find(u => u.userId === userSession.userId)) {
      localStoragePromises.push(removeUserSessionFromLocalStorage(false));
    }

    await Promise.all(localStoragePromises);

    // Save the user list to redux for display in Account Picker UIs
    dispatch({ type: actions.UPDATE_USER_LIST, userList: verifiedUsers });
  };
};
