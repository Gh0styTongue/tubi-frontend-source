import type { AuthType } from '@tubitv/analytics/lib/baseTypes';
import { AuthTypes } from '@tubitv/analytics/lib/baseTypes';
import QRCode from 'qrcode';

import { getCookie, removeCookie } from 'client/utils/localDataStorage';
import type { FetchWithTokenOptions } from 'common/actions/fetch';
import { fetchWithToken } from 'common/actions/fetch';
import getConfig from 'common/apiConfig';
import { AGE_GATE_BIRTHDAY, AGE_GATE_COOKIE, COPPA_COMPLIANT } from 'common/constants/cookies';
import type { UapiPlatformType } from 'common/constants/platforms';
import { logoutUser, saveUser } from 'common/features/authentication/api/user';
import {
  ACTIVATION_CODE_OPTION_PARAM,
  ACTIVATION_CODE_QUERY_PARAM,
  AUTH_ENDPOINT_TIMEOUT_MS,
} from 'common/features/authentication/constants/auth';
import { userIdSelector, isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type {
  AuthThunk,
  RequestActivationCodeResponse,
  RegistrationData,
  UAPIAuthResponse,
  User,
} from 'common/features/authentication/types/auth';
import type { UserOrPending } from 'common/features/authentication/utils/api';
import {
  activationCodeCallback,
  loginCallback,
  magicLinkCallback,
  processUAPIAuthError,
  processUAPIAuthResponse,
  registrationLinkCallback,
  magicLinkFromEmailCallback,
} from 'common/features/authentication/utils/api';
import { trackRequestTime } from 'common/features/authentication/utils/tracking';
import logger from 'common/helpers/logging';
import { deviceIdSelector } from 'common/selectors/deviceId';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { RouteCode } from 'common/types/route-codes';
import { getPlatform } from 'common/utils/platform';
import { getClientUser } from 'common/utils/server';
import { REGENERATE_TOKEN_CODES } from 'common/utils/token';
import { getIntl } from 'i18n/intl';

import messages from './messages';

const config = getConfig();
const { uapi, accountServiceDevicePrefix, accountServiceUserPrefix } = config;

export const addDelayedRegistrationParamIfEnabled = (options: FetchWithTokenOptions) => {
  /* istanbul ignore next */
  if (__DEVELOPMENT__ || __STAGING__ || __IS_ALPHA_ENV__) {
    if (FeatureSwitchManager.isEnabled('DelayedRegistration')) {
      options.params ??= {};
      options.params.delayed_registration_test = true;
    }
  }
};

/**
 * Check if email is available
 * was /oz/auth/check_email/:email (from src/server/routes/auth.ts)
 */
export const fetchEmailAvailable = (email: string): AuthThunk<Promise<{ code: RouteCode }>> => {
  return async (dispatch) => {
    try {
      const url = `${uapi.emailAvailable}?email=${encodeURIComponent(email)}`;
      const response = await dispatch(fetchWithToken<{ code: RouteCode }>(url, { method: 'get' }));
      return response;
    } catch (err) {
      logger.error({ error: err, errorMessage: err.message }, 'error when checking email');
      return Promise.reject(err);
    }
  };
};

export interface LoginWithAmazonParams {
  token: string;
  birthday?: string;
  shouldSkipServerErrorRedirect?: boolean;
}

/**
 * Login with Amazon
 * was /oz/auth/amazon (from src/server/routes/auth.ts)
 */
export const loginWithAmazon = ({
  token,
  birthday,
  shouldSkipServerErrorRedirect = false,
}: LoginWithAmazonParams): AuthThunk<Promise<User>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const deviceId = deviceIdSelector(state);
    const url = uapi.login;
    const options: FetchWithTokenOptions = {
      method: 'post',
      data: {
        type: 'amazon',
        platform: getPlatform(),
        device_id: deviceId,
        credentials: {
          token,
          birthday,
        },
      },
      shouldAddAdvertiserId: true,
      timeout: AUTH_ENDPOINT_TIMEOUT_MS,
    };

    try {
      const startTime = Date.now();
      const response = await dispatch(fetchWithToken<UAPIAuthResponse>(url, options));
      trackRequestTime({
        startTime,
        endpoint: 'POST /user/login',
        platform: 'FIRETV_HYB',
      });
      return dispatch(
        processUAPIAuthResponse({
          authType: 'AMAZON',
          callback: loginCallback,
          response,
          url,
        })
      );
    } catch (err) {
      const wrappedLoginCallback = (params: Parameters<typeof loginCallback>[0]) => loginCallback({
        ...params,
        shouldHandleAuthError: !shouldSkipServerErrorRedirect,
      });
      return dispatch(
        processUAPIAuthError({
          authType: 'AMAZON',
          callback: wrappedLoginCallback,
          err,
        })
      );
    }
  };
};

interface LoginWithEmailParams {
  authType?: AuthType;
  username: string;
  password: string;
}

/**
 * Login with email and password
 * was /oz/auth/login (from src/server/routes/auth.ts)
 */
export const loginWithEmail = ({
  authType: originalAuthType,
  username: email,
  password,
}: LoginWithEmailParams): AuthThunk<Promise<User>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const deviceId = deviceIdSelector(state);
    const authType = originalAuthType && AuthTypes.includes(originalAuthType) ? originalAuthType : 'EMAIL';
    try {
      const url = uapi.login;
      const options: FetchWithTokenOptions = {
        method: 'post',
        data: {
          type: 'email',
          platform: getPlatform(),
          device_id: deviceId,
          credentials: {
            email,
            password,
          },
          errorLog: false,
        },
        shouldAddAdvertiserId: true,
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      };
      addDelayedRegistrationParamIfEnabled(options);
      const response = await dispatch(fetchWithToken<UAPIAuthResponse>(url, options));
      return dispatch(
        processUAPIAuthResponse({
          authType,
          callback: loginCallback,
          response,
          url,
        })
      );
    } catch (err) {
      return dispatch(
        processUAPIAuthError({
          authType,
          callback: loginCallback,
          err,
        })
      );
    }
  };
};

/**
 * User sign-up
 * was /oz/auth/register/email (from src/server/routes/auth.ts)
 */
export const registerWithEmail = ({
  firstName,
  password,
  email,
  emailType,
  gender,
  birthday: birth,
  registrationUID,
  personalizedEmails,
}: Partial<RegistrationData> & { birthday: string }): AuthThunk<Promise<User>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const deviceId = deviceIdSelector(state);
    const {
      auth: { user, userIP },
      ui: { userLanguageLocale },
    } = state;
    if (user && !registrationUID) {
      return Promise.reject({
        message: 'You are already logged in', // error message not shown in UI currently
        status: 400,
      });
    }

    let birthday = birth;
    // do some validation here since server is very picky
    const isInvalidDate = isNaN(new Date(birthday).getTime());
    if (isInvalidDate) {
      logger.warn({ birth, email, firstName }, 'birthday is not valid');
      const routeCode: RouteCode = 'INVALID_BIRTHDAY';
      return Promise.reject({
        routeCode,
        status: 400,
      });
    }

    const bday = new Date(birthday);
    birthday = `${bday.getFullYear()}-${bday.getMonth() + 1}-${bday.getDate()}`;

    const url = uapi.userSignup;
    const options: FetchWithTokenOptions = {
      method: 'post',
      errorLog: false,
      data: {
        platform: getPlatform(),
        device_id: deviceId,
        type: registrationUID ? 'registration_link' : 'email',
        credentials: {
          email,
          email_type: emailType,
          password,
          first_name: firstName,
          registration_uid: registrationUID,
          gender,
          birthday,
        },
        gdpr_personalized_emails: personalizedEmails,
      },
      shouldAddAdvertiserId: true,
      timeout: AUTH_ENDPOINT_TIMEOUT_MS,
    };

    addDelayedRegistrationParamIfEnabled(options);

    try {
      const startTime = Date.now();
      const response = await dispatch(fetchWithToken<UAPIAuthResponse>(url, options));

      trackRequestTime({
        startTime,
        endpoint: 'POST /user/signup',
        platform: 'FIRETV_HYB',
      });
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
        hasAge,
      };
      await dispatch(saveUser(user, getIntl(userLanguageLocale), 'signUp'));
      return getClientUser({
        ...user,
        token: user.accessToken,
      });
    } catch (err) {
      const { code, route_code: routeCode, status } = err;
      const errorInfo = {
        error: err,
        ip: userIP,
        data: {
          email,
          firstName,
          gender,
          birthday,
          passwordLength: password?.length,
          deviceId,
        },
      };
      if ([code, routeCode].includes('EMAIL_USER_EXISTS')) {
        logger.info(errorInfo, 'User already exists when signup by email');
        return Promise.reject({
          routeCode,
          status,
        });
      }
      if ([code, routeCode].includes('BELOW_MIN_AGE')) {
        logger.info(errorInfo, 'User is below minimum age requirement on signup by email');
        return Promise.reject({
          routeCode,
          status,
        });
      }
      if ([code, routeCode].includes('INVALID_EMAIL_DOMAIN')) {
        logger.info(errorInfo, 'The email domain provided is invalid');
        return Promise.reject({
          routeCode,
          status,
        });
      }
      if ([code, routeCode].includes('LEGAL')) {
        logger.info(errorInfo, 'Unavailable for legal reasons on signup by email');
        return Promise.reject({
          routeCode,
          status,
        });
      }
      if (REGENERATE_TOKEN_CODES.some((c) => c === code)) {
        logger.info(errorInfo, 'Register token error');
        return Promise.reject({
          code,
          status,
        });
      }
      if (code === 'ACCOUNT_PENDING_PROCESSING') {
        logger.info(errorInfo, 'Delayed registration response on signup by email');
        return Promise.reject({
          code,
          status,
        });
      }

      logger.error(errorInfo, 'Unexpected error when signing up by email');
      return Promise.reject({
        routeCode: 'UNEXPECTED_ERROR',
        status,
      });
    }
  };
};

export const resendConfirmEmail = (): AuthThunk<Promise<void>> => {
  return (dispatch) =>
    dispatch(
      fetchWithToken<void>(uapi.signUpConfirmationEmail, {
        method: 'post',
        data: {
          platform: getPlatform(),
        },
      })
    );
};

export const checkEmailConfirmToken = (token: string): AuthThunk<Promise<void>> => {
  return (dispatch) =>
    dispatch(
      fetchWithToken<void>(uapi.signUpConfirm, {
        method: 'post',
        data: {
          confirmation_token: token,
        },
      })
    );
};

type RegisterDeviceData = {
  platform: UapiPlatformType;
  device_id?: string;
  birthday: string;
};

type RegisterDeviceResponse = {
  age: string;
};

/**
 * Register device for guest
 * was /oz/auth/register_device (from src/server/routes/auth.ts)
 */
export const registerDevice = (data: RegisterDeviceData): AuthThunk<Promise<RegisterDeviceResponse>> => {
  return (dispatch) => {
    return dispatch(
      fetchWithToken<RegisterDeviceResponse>(`${accountServiceDevicePrefix}/register`, {
        method: 'post',
        data,
        retryCount: 1,
        errorLog: false,
      })
    ).catch((err) => {
      if (err.status === 422) {
        logger.info(err, 'User is below minimum age requirement when register device');
      } else if (err.status === 451) {
        logger.info(err, 'Unavailable For Legal Reasons');
      } else {
        logger.error({ error: err, option: data }, 'error when register device');
      }
      return Promise.reject(err);
    });
  };
};

interface LoginWithGoogleParams {
  idToken: string;
}

/**
 * Login with Google OneTap
 * was /oz/auth/google (from src/server/routes/auth.ts)
 */
export const loginWithGoogleOneTap = ({ idToken }: LoginWithGoogleParams): AuthThunk<Promise<User>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const deviceId = deviceIdSelector(state);
    try {
      const url = uapi.login;
      const options: FetchWithTokenOptions = {
        method: 'post',
        data: {
          type: 'google',
          platform: getPlatform(),
          device_id: deviceId,
          credentials: {
            token: idToken,
          },
        },
        shouldAddAdvertiserId: true,
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      };
      addDelayedRegistrationParamIfEnabled(options);
      const response = await dispatch(fetchWithToken<UAPIAuthResponse>(url, options));
      return dispatch(
        processUAPIAuthResponse({
          authType: 'GOOGLE',
          callback: loginCallback,
          response,
          url,
        })
      );
    } catch (err) {
      const wrappedLoginCallback = (params: Parameters<typeof loginCallback>[0]) => loginCallback({ ...params, shouldHandleAuthError: __ISOTT__ });
      return dispatch(
        processUAPIAuthError({
          authType: 'GOOGLE',
          callback: wrappedLoginCallback,
          err,
        })
      );
    }
  };
};

interface ChangePasswordParams {
  currentPassword: string;
  password: string;
}

export const changePassword = ({ currentPassword, password }: ChangePasswordParams): AuthThunk<Promise<void>> => {
  return (dispatch, getState) => {
    const state = getState();
    const deviceId = deviceIdSelector(state);
    const userId = userIdSelector(state);
    const { ui } = state;
    return dispatch(
      fetchWithToken<void>(uapi.changePassword, {
        method: 'post',
        data: {
          user_id: userId,
          old_pass: currentPassword,
          new_pass: password,
          device_id: deviceId,
          platform: getPlatform(),
        },
      })
    ).catch((error) => {
      if (!error.message) {
        const intl = getIntl(ui.userLanguageLocale);
        error.message = intl.formatMessage(messages.password);
      }
      return Promise.reject(error);
    });
  };
};

interface SetParentalControlsParams {
  rating: number;
  password: string;
}

export const setParentalControls = ({ rating, password }: SetParentalControlsParams): AuthThunk<Promise<void>> => {
  const url = `${accountServiceUserPrefix}/settings/parental_rating`;

  return (dispatch, getState) => {
    const { ui } = getState();
    const intl = getIntl(ui.userLanguageLocale);

    return dispatch(
      fetchWithToken<void>(url, {
        method: 'put',
        data: {
          parental_rating: rating,
          password,
        },
      })
    ).catch((err) => {
      const statusCode = err.httpCode;
      let message = intl.formatMessage(messages.parentalError);
      if (statusCode === 403) {
        message = intl.formatMessage(messages.invalidPass);
      } else if (statusCode === 404) {
        message = intl.formatMessage(messages.parentalUser);
      } else {
        logger.error(
          {
            error: err,
            option: {
              url,
              method: 'PUT',
              body: {
                parental_rating: rating,
                password: password.replace(/./g, '*'),
              },
            },
          },
          'error when updating parental control'
        );
      }
      throw new Error(message);
    });
  };
};

/**
 * Sends the magic link email
 * was /oz/auth/magic-link (from src/server/routes/auth.ts)
 */
export const sendMagicLink = (email: string): AuthThunk<Promise<string>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const intl = getIntl(state.ui.userLanguageLocale);
    const deviceId = deviceIdSelector(state);
    try {
      const url = uapi.magicLink;
      const options: FetchWithTokenOptions = {
        method: 'post',
        data: {
          device_id: deviceId,
          platform: getPlatform(),
          email,
        },
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      };
      const startTime = Date.now();
      const response = await dispatch(fetchWithToken<{ uid: string }>(url, options));

      trackRequestTime({
        startTime,
        endpoint: 'POST /device/magic_link',
        platform: 'TIZEN',
      });
      return response.uid;
    } catch (err) {
      logger.error(err, 'Error while sending magic link');
      const statusCode = err.httpCode;
      return Promise.reject({
        message: intl.formatMessage(messages.ottMagicLinkStatus, { statusCode }),
        status: err.status,
        statusCode,
      });
    }
  };
};

/**
 * Checks magic link status for login success
 * was /oz/auth/magic-link-status (from src/server/routes/auth.ts)
 */
export const getMagicLinkStatus = (uid: string): AuthThunk<Promise<UserOrPending>> => {
  return async (dispatch) => {
    try {
      const url = `${uapi.magicLink}/${uid}`;
      const options: FetchWithTokenOptions = {
        method: 'get',
        shouldAddAdvertiserId: true,
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      };
      const startTime = Date.now();
      const response = await dispatch(fetchWithToken<UAPIAuthResponse>(url, options));
      trackRequestTime({
        startTime,
        endpoint: 'GET /device/magic_link/uid',
        platform: 'TIZEN',
      });
      return dispatch(
        processUAPIAuthResponse<UserOrPending>({
          authType: 'EMAIL',
          callback: magicLinkCallback,
          response,
          url,
        })
      );
    } catch (err) {
      return dispatch(
        processUAPIAuthError<UserOrPending>({
          authType: 'EMAIL',
          callback: magicLinkCallback,
          err,
        })
      );
    }
  };
};

/**
 * Sends the registration link email
 * was /oz/auth/registration-link (from src/server/routes/auth.ts)
 */
export const sendRegistrationLink = (email: string): AuthThunk<Promise<string>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const intl = getIntl(state.ui.userLanguageLocale);
    const deviceId = deviceIdSelector(state);
    try {
      const url = uapi.registrationLink;
      const options: FetchWithTokenOptions = {
        method: 'post',
        data: {
          device_id: deviceId,
          platform: getPlatform(),
          email,
        },
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      };
      const response = await dispatch(fetchWithToken<{ uid: string }>(url, options));
      return response.uid;
    } catch (err) {
      logger.error(err, 'Error while sending magic link');
      const statusCode = err.httpCode;
      return Promise.reject({
        message: intl.formatMessage(messages.ottRegistrationLinkStatus, { statusCode }),
        status: err.status,
        statusCode,
      });
    }
  };
};

/**
 * Checks registration link status for login success
 * was /oz/auth/registration-link-status (from src/server/routes/auth.ts)
 */
export const getRegistrationLinkStatus = (uid: string): AuthThunk<Promise<UserOrPending>> => {
  return async (dispatch) => {
    try {
      const url = `${uapi.registrationLink}/${uid}`;
      const options: FetchWithTokenOptions = {
        method: 'get',
        shouldAddAdvertiserId: true,
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      };
      const response = await dispatch(fetchWithToken<UAPIAuthResponse>(url, options));
      return dispatch(
        processUAPIAuthResponse<UserOrPending>({
          authType: 'EMAIL',
          callback: registrationLinkCallback,
          response,
          url,
        })
      );
    } catch (err) {
      return dispatch(
        processUAPIAuthError<UserOrPending>({
          authType: 'EMAIL',
          callback: registrationLinkCallback,
          err,
        })
      );
    }
  };
};

/**
 * Magic link login from email
 * was /oz/auth/magic-link/:uid (from src/server/routes/auth.ts)
 */
export const loginWithMagicLinkFromEmail = (uid: string): AuthThunk<Promise<void>> => {
  return async (dispatch) => {
    try {
      const url = `${uapi.magicLink}/${uid}`;
      const options: FetchWithTokenOptions = {
        method: 'get',
        shouldAddAdvertiserId: true,
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      };
      const response = await dispatch(fetchWithToken<UAPIAuthResponse>(url, options));
      return dispatch(
        processUAPIAuthResponse<void>({
          authType: 'EMAIL',
          callback: magicLinkFromEmailCallback,
          response,
          url,
        })
      );
    } catch (err) {
      return dispatch(
        processUAPIAuthError<void>({
          authType: 'EMAIL',
          callback: magicLinkFromEmailCallback,
          err,
        })
      );
    }
  };
};

/**
 * Generates a URL that encodes an activation code for the QR code based login
 * flow.
 * @param activationCode
 */
export function generateActivationURL(activationCode: string, option: string) {
  return `https://tubitv.com/activate?${ACTIVATION_CODE_QUERY_PARAM}=${activationCode}&${ACTIVATION_CODE_OPTION_PARAM}=${option}`;
}

/**
 * Request an activation code for OTT
 * was /oz/auth/ott-activate (from src/server/routes/auth.ts)
 */
export const requestActivationCode = (
  shouldGenerateQRCode: boolean
): AuthThunk<Promise<RequestActivationCodeResponse>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const intl = getIntl(state.ui.userLanguageLocale);
    const deviceId = deviceIdSelector(state);
    try {
      const url = uapi.codeGenerate;
      const options: FetchWithTokenOptions = {
        method: 'post',
        data: {
          device_id: deviceId,
          platform: getPlatform(),
        },
        retryCount: 1,
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      };
      const response = await dispatch(fetchWithToken<RequestActivationCodeResponse>(url, options));
      const { activation_code, activation_token } = response;
      if (shouldGenerateQRCode) {
        return new Promise((resolve, reject) => {
          QRCode.toDataURL(generateActivationURL(activation_code, 'qr'), (qrcodeErr, url) => {
            if (qrcodeErr) {
              logger.error(qrcodeErr, 'Error generating the activation QR code');
              return reject({ message: 'Error generating the activation QR code' });
            }
            return resolve({
              activation_code,
              activation_token,
              qr_code_data_url: url,
            });
          });
        });
      }
      return { activation_code, activation_token };
    } catch (err) {
      const statusCode = err.httpCode;
      if (statusCode === 403) {
        return Promise.reject({ status: statusCode, message: intl.formatMessage(messages.ottActivateAuth) });
      }
      if (statusCode === 429) {
        return Promise.reject({ status: statusCode, message: intl.formatMessage(messages.ottActivateRate) });
      }
      if (statusCode >= 500) {
        return Promise.reject({ status: statusCode, message: intl.formatMessage(messages.ottActivateInternal) });
      }
      return Promise.reject({
        status: statusCode,
        message: intl.formatMessage(messages.ottActivateStatus, { statusCode }),
      });
    }
  };
};

/**
 * Check activation code for login success
 * was /oz/auth/ott-activation-token-status (from src/server/routes/auth.ts)
 */
export const checkActivationCodeStatus = (code: string): AuthThunk<Promise<UserOrPending>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const deviceId = deviceIdSelector(state);
    try {
      const url = uapi.codeStatus;
      const options: FetchWithTokenOptions = {
        method: 'post',
        data: {
          device_id: deviceId,
          platform: getPlatform(),
          activation_token: code,
        },
        shouldAddAdvertiserId: true,
        timeout: AUTH_ENDPOINT_TIMEOUT_MS,
      };
      const response = await dispatch(fetchWithToken<UAPIAuthResponse>(url, options));
      return dispatch(
        processUAPIAuthResponse<UserOrPending>({
          authType: 'CODE',
          callback: activationCodeCallback,
          response,
          url,
        })
      );
    } catch (err) {
      return dispatch(
        processUAPIAuthError<UserOrPending>({
          authType: 'CODE',
          callback: activationCodeCallback,
          err,
        })
      );
    }
  };
};

interface LogoutAccountParams {
  isByUser?: boolean;
  logoutOnProxyServerOnly?: boolean;
}
/*
 * Logout the account service.
 *   Clears access_token & refresh_token issued by account service.
 *   To fully clear the user session, `logoutUser` in `api/user` is called together.
 *
 *   NOTE: `logoutOnProxyServerOnly` is an option for the cases where user is already deleted,
 *   for example, when user delete account or fail coppa, in those cases, the account is deleted by the account service.
 * was /oz/auth/logout (from src/server/routes/auth.ts)
 */
export const logoutAccount = ({
  isByUser = false,
  logoutOnProxyServerOnly = false,
}: LogoutAccountParams = {}): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const deviceId = deviceIdSelector(state);
    try {
      const url = uapi.logout;
      await (logoutOnProxyServerOnly
        ? Promise.resolve()
        : dispatch(
          fetchWithToken(url, {
            method: 'post',
            data: {
              platform: getPlatform(),
              device_id: deviceId,
            },
          })
        ));

      const {
        auth: { user },
      } = getState();
      await dispatch(logoutUser(user as User, { intentional: isByUser }));
    } catch (err) {
      return Promise.reject(err);
    } finally {
      removeCookie(AGE_GATE_BIRTHDAY);
      if (getCookie(AGE_GATE_COOKIE) === COPPA_COMPLIANT) {
        removeCookie(AGE_GATE_COOKIE);
      }
    }
  };
};

/**
 * Activate a device
 * was /oz/auth/activate (from src/server/routes/auth.ts)
 */
export const activateDevice = (code: string): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const intl = getIntl(state.ui.userLanguageLocale);
    const isLoggedIn = isLoggedInSelector(state);
    if (isLoggedIn) {
      try {
        const url = uapi.activateDevice;
        const options: FetchWithTokenOptions = {
          method: 'post',
          data: {
            activation_code: code,
          },
        };
        addDelayedRegistrationParamIfEnabled(options);
        await dispatch(fetchWithToken<void>(url, options));
      } catch (err) {
        const statusCode = err.httpCode;
        if (statusCode === 400) {
          return Promise.reject({ status: 400, message: intl.formatMessage(messages.activateError) });
        }
        if (statusCode === 403) {
          return Promise.reject({ status: 403, message: intl.formatMessage(messages.activateAuth) });
        }
        return Promise.reject({ status: statusCode, message: intl.formatMessage(messages.activateUnknown) });
      }
    } else {
      return Promise.reject({ status: 403, message: intl.formatMessage(messages.activateLoggedIn) });
    }
  };
};

interface PartnerTokenResponse {
  access_token: string;
  expires_in?: number;
}

export const getPartnerToken = (partner: string): AuthThunk<Promise<PartnerTokenResponse| null>> => {
  return async (dispatch) => {
    try {
      const url = `${accountServiceDevicePrefix}/partner/token`;
      const options: FetchWithTokenOptions = {
        method: 'get',
        params: {
          partner,
        },
      };
      return await dispatch(fetchWithToken<PartnerTokenResponse>(url, options));
    } catch (err) {
      logger.error(err, 'Error while getting partner token');
      return Promise.reject(err);
    }
  };
};
