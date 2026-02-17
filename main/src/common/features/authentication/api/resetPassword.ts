import validator from 'validator';

import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import messages from 'common/features/authentication/api/messages';
import type { AuthThunk } from 'common/features/authentication/types/auth';
import { deviceIdSelector } from 'common/selectors/deviceId';
import { getPlatform } from 'common/utils/platform';
import { getIntl } from 'i18n/intl';

const config = getConfig();
const { uapi } = config;

interface UpdatePasswordParams {
    userId: string;
    token: string | number;
    password: string;
}

export const updatePassword = ({ userId, token, password }: UpdatePasswordParams): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const intl = getIntl(state.ui.userLanguageLocale);
    const deviceId = deviceIdSelector(state);

    const url = `${uapi.resetPassword}/update`;
    const options: FetchWithTokenOptions = {
      method: 'post',
      data: {
        user_id: userId,
        token,
        new_pass: password,
        platform: getPlatform(),
        device_id: deviceId,
      },
    };
    try {
      await dispatch(fetchWithToken<void>(url, options));
    } catch (error) {
      if ('type' in error && error.type === 'ValidationError') {
        error.message = intl.formatMessage(messages.unknown);
        delete error.messages;
      }
      return Promise.reject(error);
    }
  };
};

interface ValidateResetPasswordTokenResponse {
  userId: number;
}

export const validateResetPasswordToken = (token: string | number): AuthThunk<Promise<ValidateResetPasswordTokenResponse>> => {
  return (dispatch, getState) => {
    const state = getState();
    const intl = getIntl(state.ui.userLanguageLocale);
    if (!token) {
      return Promise.reject({ message: intl.formatMessage(messages.token) });
    }

    const url = `${uapi.resetPassword}/${token}`;
    const options: FetchWithTokenOptions = {
      method: 'get',
      errorLog: false,
    };
    return dispatch(fetchWithToken<{ user_id: number }>(url, options))
      .then(({ user_id }) => ({ userId: user_id }));
  };
};

export const sendResetPasswordEmail = (email: string): AuthThunk<Promise<void>> => {
  return (dispatch, getState) => {
    const state = getState();
    const intl = getIntl(state.ui.userLanguageLocale);
    const deviceId = deviceIdSelector(state);

    if (!validator.isEmail(email)) {
      return Promise.reject({ message: intl.formatMessage(messages.email) });
    }

    const url = uapi.resetPassword;
    const options: FetchWithTokenOptions = {
      method: 'post',
      data: {
        device_id: deviceId,
        platform: getPlatform(),
        email,
      },
    };
    return dispatch(fetchWithToken<void>(url, options));
  };
};
