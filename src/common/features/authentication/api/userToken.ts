import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import { logoutUser, updateUser } from 'common/features/authentication/api/user';
import type { AuthThunk, UAPIAuthResponse, User } from 'common/features/authentication/types/auth';
import logger from 'common/helpers/logging';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { getPlatform } from 'common/utils/platform';
import { getIntl } from 'i18n/intl';

const { uapi } = getConfig();

const sendRefreshTokenRequest = (): AuthThunk<Promise<UAPIAuthResponse | undefined>> => {
  return (dispatch, getState) => {
    const state = getState();
    const url = uapi.refresh;
    const options: FetchWithTokenOptions = {
      method: 'post',
      data: {
        platform: getPlatform(),
        device_id: deviceIdSelector(state),
      },
      shouldUseRefreshToken: true,
    };
    return dispatch(fetchWithToken<UAPIAuthResponse>(url, options));
  };
};

/**
 * Refresh the user access token
 * If this returns undefined, the app will continue to use the last known token
 */
export const fetchTokenRefresh = (): AuthThunk<Promise<User['token'] | undefined>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const {
      auth: { user, userIP },
      ui: { userLanguageLocale },
    } = state;

    if (!user || !user.refreshToken) {
      return;
    }

    try {
      const response = await dispatch(sendRefreshTokenRequest());
      const accessToken = response?.access_token;

      if (!accessToken) {
        const {
          auth: { user },
        } = state;
        logger.error({ user, response }, 'unexpected response on refreshing token');
        return;
      }

      // update user in Redis on proxy server
      const intl = getIntl(userLanguageLocale);
      await dispatch(updateUser({ accessToken }, intl));

      return accessToken;
    } catch (err) {
      const logData = {
        deviceId: deviceIdSelector(state),
        err,
        errMessage: err.message,
        ip: userIP,
        status: err.status,
        user,
      };

      // According to https://uapi.adrise.tv/swagger/#!/default/post_user_device_login_refresh
      // If server cannot verify the refresh token, it will return a 403.
      // Log the user out.
      if (err.status === 403) {
        logger.info(logData, 'Server cannot verify the refresh token');
        await dispatch(logoutUser(user as User, { intentional: false }));
        return Promise.reject(err);
      }

      logger.error(logData, 'Error while refreshing token');
      return Promise.reject(err);
    }
  };
};
