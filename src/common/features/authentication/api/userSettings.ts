import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import { logoutUser } from 'common/features/authentication/api/user';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type { AuthThunk, User } from 'common/features/authentication/types/auth';
import logger from 'common/helpers/logging';
import { deviceIdSelector } from 'common/selectors/deviceId';
import type { LoadUserSettingsResponse, UAPIUserSettingsResponse, UserSettingsState } from 'common/types/userSettings';
import { getPlatform } from 'common/utils/platform';
import { getIntl } from 'i18n/intl';

import messages from './messages';

const config = getConfig();
const { uapi, accountServiceUserPrefix } = config;

export type DisableAccountParam = {
  type: string;
  token: string;
  reasons: string[];
  other?: string;
};

/**
 * Delete Account
 * was /oz/auth/disable (from src/server/routes/auth.ts)
 */
export const disableAccount = (data: DisableAccountParam): AuthThunk<Promise<void>> => {
  return (dispatch) => {
    const url = `${accountServiceUserPrefix}/disable`;
    return dispatch(
      fetchWithToken<void>(url, {
        method: 'post',
        data,
        errorLog: false,
      })
    ).catch((err) => {
      /* istanbul ignore else */
      if (err) {
        const level = err.httpCode === 401 ? 'info' : 'error';
        logger[level]({ error: err, option: data }, 'error when disabling user');
      }
      return Promise.reject(err);
    });
  };
};

/**
 * Get user settings
 * was GET /oz/auth/user_settings (from src/server/routes/auth.ts)
 * @param token - during login we fetch user settings before we save the user object in redux - including the token param here will override the Authorization header passed into fetchWithToken so that we fetch with the new token
 */
export const fetchUserSettings = (token?: User['token']): AuthThunk<Promise<LoadUserSettingsResponse>> => {
  return async (dispatch, getState) => {
    try {
      const url = uapi.userSettings;
      const options: FetchWithTokenOptions = {
        method: 'get',
        errorLog: false,
      };
      if (token) {
        options.headers = {
          Authorization: `Bearer ${token}`,
        };
      }
      const response = await dispatch(fetchWithToken<UAPIUserSettingsResponse>(url, options));

      const {
        facebook_id: facebookId,
        email,
        first_name,
        gender,
        profile_pic: profilePic,
        enabled,
        has_password: hasPassword,
        parental_rating: parentalRating,
        notification_settings,
        birthday,
      } = response;

      return {
        facebookId,
        email,
        first_name,
        gender,
        profilePic,
        enabled,
        hasPassword,
        parentalRating,
        notification_settings,
        birthday,
      };
    } catch (err) {
      const state = getState();
      const {
        auth: { user },
      } = state;
      const errorInfo = {
        error: err,
        errorMessage: err.message,
        errorStatus: err.status,
        deviceId: deviceIdSelector(state),
        userInfo: user,
      };

      if (err.route_code === 'INVALID_EMAIL_OR_PASSWORD') {
        logger.error(errorInfo, 'Log out as the account has been deleted.');
        await dispatch(logoutUser(user as User, { intentional: false }));
        return Promise.reject(err);
      }

      logger.error(errorInfo, 'error when getting userSetting');
      return Promise.reject(err);
    }
  };
};

/**
 * Save new user settings
 * was PATCH /oz/auth/user_settings (from src/server/routes/auth.ts)
 */
export const patchUserSettings = (newUserSettings: Partial<UserSettingsState>): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const {
      auth: { user },
      ui: { userLanguageLocale },
    } = state;
    const intl = getIntl(userLanguageLocale);

    if (!isLoggedInSelector(state)) {
      return Promise.reject({ code: 401, message: intl.formatMessage(messages.loggedin), status: 401 });
    }

    const url = uapi.userSettings;
    const options: FetchWithTokenOptions = {
      data: {
        ...newUserSettings,
        platform: getPlatform(),
      },
      retryCount: 1,
      errorLog: false,
      method: 'patch',
    };

    try {
      await dispatch(fetchWithToken<UAPIUserSettingsResponse>(url, options));
    } catch (err) {
      /* istanbul ignore else */
      if (err.httpCode === 422) {
        logger.info(err, 'User is below minimum age requirement on signup by email');
      } else if (err.code !== 'Conflict') {
        logger.error(
          {
            error: err,
            options,
            user,
          },
          'error when updating userSetting'
        );
      }
      return Promise.reject(err);
    }
  };
};
