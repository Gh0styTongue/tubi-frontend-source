import type { ThunkAction } from 'redux-thunk';
import type { ValueOf } from 'ts-essentials';

import systemApi from 'client/systemApi';
import { getCookie } from 'client/utils/localDataStorage';
import getConfig from 'common/apiConfig';
import { COOKIE_ADVERTISER_ID } from 'common/constants/cookies';
import { logoutUser } from 'common/features/authentication/api/user';
import type { AuthThunk, User } from 'common/features/authentication/types/auth';
import { isUserNotFound } from 'common/features/authentication/utils/user';
import { getUserToken } from 'common/features/authentication/utils/userToken';
import type { ApiClientMethodOptions, ApiClientMethods } from 'common/helpers/ApiClient';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { AUTH_ERROR_CODES, AUTH_ERROR_MESSAGES, pathToRoute } from 'common/utils/api';
import { getPlatform } from 'common/utils/platform';
import { isEndpointDisabled } from 'common/utils/remoteConfig';
import { getAnonymousTokenRequestOptions } from 'common/utils/token';

export interface FetchWithTokenOptions extends ApiClientMethodOptions {
  errorLog?: boolean;
  method?: ApiClientMethods;
  shouldAddAdvertiserId?: boolean;
  shouldUseRefreshToken?: boolean;
}

interface ApiError extends Error {
  code?: string | number;
  error?: string;
  httpCode?: number;
  status?: number;
}

const { uapi } = getConfig();

// endpoints that may only accept anonymous auth tokens
const ANONYMOUS_TOKEN_ONLY_ENDPOINTS: ValueOf<typeof uapi>[] = [
  uapi.emailAvailable,
  uapi.login,
  uapi.magicLink,
  uapi.userSignup,
];

const forceAnonymousToken = (url: string) => ANONYMOUS_TOKEN_ONLY_ENDPOINTS.includes(url);

export const logError = (url: string, fetchOptions: FetchWithTokenOptions, error: ApiError) => {
  const { errorLog = true, method, ...options } = fetchOptions;

  // don't log 404 error for web, except when running tests
  // don't log if errorLog option is false
  if ((error.httpCode === 404 && __WEBPLATFORM__ && !__TESTING__) || !errorLog) return;

  const path = new URL(url).pathname;

  const errorInfo = {
    error,
    errorMessage: error.message,
    statusCode: error.httpCode,
    options,
    path,
  };

  const route = pathToRoute(path);

  if (error.code === 'ESOCKETTIMEDOUT') {
    logger.error(errorInfo, `request timeout - ${route}`);
  } else if (
    error.httpCode === 401 ||
    error.httpCode === 403 ||
    (error.httpCode === 400 &&
      (AUTH_ERROR_CODES.includes(error.code as string) ||
        AUTH_ERROR_MESSAGES.includes(error.message) ||
        AUTH_ERROR_MESSAGES.includes(error.error as string)))
  ) {
    logger.info(errorInfo, `upstream authentication failure - ${route}`);
  } else if (error.httpCode === 404 || error.httpCode === 429) {
    logger.info(errorInfo, `Error [${method} request] - ${route}`);
  } else {
    logger.error(errorInfo, `Error [${method} request] - ${route}`);
  }
};

const decorateApiError = (error: ApiError, statusCode: number) => {
  error.code ??= statusCode;
  error.httpCode = statusCode;
  error.status ??= statusCode;

  return error;
};

interface HandleUserNotFoundParams {
  error: ApiError;
  opts: FetchWithTokenOptions;
  url: string;
}

export const handleUserNotFound = ({ error, opts, url }: HandleUserNotFoundParams): AuthThunk<Promise<void>> => {
  return (dispatch, getState) => {
    const {
      auth: { deviceId, user },
    } = getState();
    const { data, method } = opts;
    const logInfo = {
      clientUrl: typeof window !== 'undefined' && window.location?.pathname,
      deviceId,
      err: error,
      req: {
        body: data,
        method,
        url,
      },
      userInfo: user,
    };
    logger.info(logInfo, 'User not found, logging user out');

    return dispatch(logoutUser(user as User, { intentional: false }));
  };
};

const addAdvertiserIdToOptions = (options: ApiClientMethodOptions) => {
  options.params ??= {};
  const idfa = getCookie(COOKIE_ADVERTISER_ID) || systemApi.getAdvertiserId();
  if (idfa) {
    options.params.idfa = idfa;
  }
};

/**
 * An action to fetch an API request client-side that handles tokens, headers, and common ApiClient options
 */
export const fetchWithToken = <RESPONSE>(
  url: string,
  opts: FetchWithTokenOptions,
): TubiThunkAction<ThunkAction<Promise<RESPONSE>, StoreState, ApiClient, any>> => {
  return async (dispatch, getState, client) => {
    const { method = 'get', shouldAddAdvertiserId, shouldUseRefreshToken, ...options } = opts;
    const {
      auth: { user, userIP },
      ui: { userLanguageLocale },
    } = getState();

    if (isEndpointDisabled(url, method)) {
      return Promise.resolve();
    }

    options.headers ??= {};

    const isAuthorizationHeaderSet = !!options.headers.Authorization;
    if (!isAuthorizationHeaderSet) {
      if (user && !forceAnonymousToken(url)) {
        let authToken;
        if (shouldUseRefreshToken) {
          authToken = user.refreshToken;
        } else {
          authToken = await getUserToken(user as User, dispatch);
        }
        if (authToken) {
          options.headers.Authorization = `Bearer ${authToken}`;
        }
      } else {
        // for anonymous users, ApiClient handles setting the Authorization header with the anonymous token
        Object.assign(options, getAnonymousTokenRequestOptions());
        options.shouldSetAuthorizationHeader = true;
      }
    }

    if (shouldAddAdvertiserId) {
      addAdvertiserIdToOptions(options);
    }

    // add `Accept-Language` header
    options.headers['accept-language'] = userLanguageLocale;

    // these headers are only needed server-side to relay data to the backend API about the client
    if (__SERVER__) {
      // automatically append `x-forwarded-for` header to track client IP
      if (!options.headers['x-forwarded-for']) {
        options.headers['x-forwarded-for'] = userIP;
      }

      // log requests during SSR to help with debugging
      /* istanbul ignore else */
      if (process.env.TUBI_ENV !== 'testing') {
        logger.debug({ ...options }, `[${method} request] - ${url}`);
      }

      // add `x-client-platform` header for web
      if (!options.headers['x-client-platform'] && __WEBPLATFORM__ === 'WEB') {
        options.headers['x-client-platform'] = getPlatform();
      }
    }

    try {
      const response = await client[method](url, options);
      return response;
    } catch (err) {
      let error = err;
      const statusCode = err.status;

      error = decorateApiError(err, statusCode);

      /* istanbul ignore else */
      if (error) {
        logError(url, opts, error);
      }

      if (statusCode >= 500) {
        // use a custom error so we don't accidentally
        // return the original error to the client
        // and preserve the original error 'code' if it is defined
        error = new Error('Internal Error');
        error.code = err.code;
        error = decorateApiError(error, statusCode);
        return Promise.reject(error);
      }

      if (isUserNotFound(statusCode, error.code)) {
        await dispatch(handleUserNotFound({ error, opts, url }));
      }

      return Promise.reject(error);
    }
  };
};
