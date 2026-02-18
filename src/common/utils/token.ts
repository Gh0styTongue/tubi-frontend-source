/* eslint-disable tubitv/no-client-folder-code-in-module-scope */
/**
 * ******************************************************
 * THIS CODE HAS BEEN COPIED TO THE FOLLOWING PLACES:
 *  - src/client/introAnonymousToken.ts
 *  - scripts/ci/generateSitemaps/tokenUtils.js
 *
 * PLEASE UPDATE CODE IN THOSE FILES IF THE CODE IN THIS FILE CHANGES
 *
 * TODO @cbengtson @xinsong
 * PR to move this logic to an external package
 * https://github.com/adRise/web_ott_npm_private_packages/pull/80
 *
 * ^^^ This will need to be refactored in order to support generating tokens with minimal 3rd party library support
 *
 * ******************************************************
 */

import { supportsLocalStorage } from '@adrise/utils/lib/localStorage';
import { timeDiffInSeconds } from '@adrise/utils/lib/time';
import Base64Encoder from 'crypto-js/enc-base64';
import HexEncoder from 'crypto-js/enc-hex';
import Utf8Encoder from 'crypto-js/enc-utf8';
import HmacSHA256 from 'crypto-js/hmac-sha256';
import WordArray from 'crypto-js/lib-typedarrays';
import SHA256 from 'crypto-js/sha256';
import type express from 'express';
import jwt_decode from 'jwt-decode';
import pick from 'lodash/pick';

import { notifyAnonymousTokenChange } from 'client/setup/tasks/setupAuthObserver';
import { getCookie, getCookieDomain, getLocalData, removeCookie, removeLocalData, setCookie, setLocalData } from 'client/utils/localDataStorage';
import { COOKIE_DEVICE_ID, ONE_HOUR, TOKEN_REQUEST_MAX_RETRY_COUNT } from 'common/constants/constants';
import type { UapiPlatformType } from 'common/constants/platforms';
import type { AuthError } from 'common/features/authentication/types/auth';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import { convertEpochToSecondsFromCurrentTime } from 'common/utils/date';
import { getPlatform } from 'common/utils/platform';
import { trackLogging } from 'common/utils/track';
import config from 'src/config';

import { isMajorEventFailsafeActive } from './remoteConfig';

// to avoid circular dependency
const getApiClient = (() => {
  let client: ApiClient | null = null;
  return () => {
    if (!client) {
      const { default: ApiClient } = require('common/helpers/ApiClient');
      client = new ApiClient();
    }
    return client as ApiClient;
  };
})();

/**
 * DOCUMENTATION FOR GENERATING AUTH/REFRESH TOKENS:
 * https://docs.google.com/document/d/1qN7hnHdgCya5ekjiFwFoeaJukt3x_I0__hakq0oPZes/
 */

export const TUBI_DEFAULT_DEVICE_ID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
const TUBI_ALGORITHM = 'TUBI-HMAC-SHA256';
const TUBI_PLATFORM = getPlatform();
/* istanbul ignore next */
let tubiDeviceIdClient = __CLIENT__ ? getCookie(COOKIE_DEVICE_ID) : TUBI_DEFAULT_DEVICE_ID;

const TUBI_SIGNED_HEADERS = 'content-type';
const TUBI_CANONICAL_REQUEST_TOKEN_URL = '/device/anonymous/token';
const TUBI_CANONICAL_REQUEST_REFRESH_URL = '/device/anonymous/refresh';
/* istanbul ignore next */
const TUBI_CLIENT_VERSION = '1.0.0';
const TUBI_CLIENT_KEY_STATIC_VALUE = 'TUBI';
const TUBI_DERIVED_KEY_MESSAGE = 'tubi_request';

/* istanbul ignore next */
const TOKEN_REQUEST_RETRY_DELAY_MS = __TESTING__ ? 0 : 1000;

const EXPIRE_BUFFER_TIME_SECONDS = 30;
const TOKEN_REQUEST_EXPIRE_TIME = 30;
const FORCE_NEW_ACCESS_TOKEN_AFTER_TIME = 30;

// anonymous token constants
/* istanbul ignore next */
export const ANONYMOUS_ACCESS_TOKEN_PATH = '/';
export const ANONYMOUS_ACCESS_TOKEN_EXPIRES = 'ate';
export const ANONYMOUS_ACCESS_TOKEN = 'at';
export const ANONYMOUS_REFRESH_TOKEN_EXPIRES = 'rte';
export const ANONYMOUS_REFRESH_TOKEN = 'rt';
export const TOKEN_BASE64_CLIENT_KEY = 'ck';
export const LAST_SUCCESSFUL_ANONYMOUS_TOKEN_RESPONSE = 'lat';

export const SERVER_ANONYMOUS_ACCESS_TOKEN = 'sat';

export const ANONYMOUS_TOKEN_CLIENT_HEADER_NAME = 'x-token';

export const SHOULD_SEND_ANONYMOUS_TOKEN_IN_HEADER = __OTTPLATFORM__ === 'TIZEN';

export const TOKEN_CODE_INVALID = 'INVALID_TOKEN';
export const TOKEN_CODE_EXPIRED = 'EXPIRED_TOKEN';
export const TOKEN_CODE_MISSING = 'MISSING_TOKEN';

export const REGENERATE_TOKEN_CODES = [
  TOKEN_CODE_INVALID,
  TOKEN_CODE_EXPIRED,
  TOKEN_CODE_MISSING,
];

export const ANONYMOUS_TOKEN_RETRY_SCALING_DURATION = 1000;

export const enum ResponseError {
  HAS_CORS_ERROR = 'HAS_CORS_ERROR',
}

export interface SigningKeyPayload {
  challenge: string;
  version: string;
  platform: UapiPlatformType;
  device_id: string;
}

export interface SigningKeyResponse {
  id: string;
  key: string;
}

export interface AnonymousTokenParams {
  verifier: string;
  id: string;
  platform: UapiPlatformType;
  device_id: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface RefreshedToken extends TokenResponse {
  user_id: number;
}

export interface TokenPayload {
  exp: number;
}

export interface AnonymousTokenQueryParams {
  'X-Tubi-Algorithm': string;
  'X-Tubi-Date': string;
  'X-Tubi-Expires': number;
  'X-Tubi-SignedHeaders': string;
  'X-Tubi-Signature': string;
}

interface TokenData {
  [ANONYMOUS_ACCESS_TOKEN_EXPIRES]: null | string;
  [ANONYMOUS_REFRESH_TOKEN_EXPIRES]: null | string;
  [ANONYMOUS_REFRESH_TOKEN]: null | string;
  [TOKEN_BASE64_CLIENT_KEY]: null | string;
  [ANONYMOUS_ACCESS_TOKEN]?: null | string;
  [LAST_SUCCESSFUL_ANONYMOUS_TOKEN_RESPONSE]?: null | TokenResponse;
}

const initialTokenData: TokenData = {
  [ANONYMOUS_ACCESS_TOKEN_EXPIRES]: null,
  [ANONYMOUS_REFRESH_TOKEN_EXPIRES]: null,
  [ANONYMOUS_REFRESH_TOKEN]: null,
  [TOKEN_BASE64_CLIENT_KEY]: null,
  [ANONYMOUS_ACCESS_TOKEN]: null,
  [LAST_SUCCESSFUL_ANONYMOUS_TOKEN_RESPONSE]: null,
};

let tokenData: TokenData = {
  [ANONYMOUS_ACCESS_TOKEN_EXPIRES]: getLocalData(ANONYMOUS_ACCESS_TOKEN_EXPIRES),
  [ANONYMOUS_REFRESH_TOKEN_EXPIRES]: getLocalData(ANONYMOUS_REFRESH_TOKEN_EXPIRES),
  [ANONYMOUS_REFRESH_TOKEN]: getLocalData(ANONYMOUS_REFRESH_TOKEN),
  [TOKEN_BASE64_CLIENT_KEY]: getLocalData(TOKEN_BASE64_CLIENT_KEY),
};

/* istanbul ignore next */
if (__CLIENT__) {
  tokenData[ANONYMOUS_ACCESS_TOKEN] = getCookie(ANONYMOUS_ACCESS_TOKEN);
}

export const delay = (delayInMs: number) => new Promise(resolve => setTimeout(resolve, delayInMs));

/**
 * https://docs.google.com/document/d/1qN7hnHdgCya5ekjiFwFoeaJukt3x_I0__hakq0oPZes/edit#heading=h.nigrw7qo6s3h
 * @returns the current ISO date formatted YYYYMMDDThhmmssZ
 */
export const getDateISO = () => {
  const dateStr = `${new Date().toISOString().split('.')[0]}Z`;
  return dateStr.replace(/[^A-Za-z0-9]/g, '');
};

/**
 * generates a string to be used to generate a code challenge string (generateCodeChallenge)
 * @returns a randomly generated Hex string or deviceId if there is an error
 */
export const generateCodeVerifier = () => {
  try {
    // check client side if window.crypto exists
    if (typeof window !== 'undefined' && !window.crypto) {
      throw new Error('window.crypto does not exist');
    }

    // NEEDS window.crypto to generate random string
    const verifier = WordArray.random(16).toString(HexEncoder);

    /*  istanbul ignore next */
    if (!verifier) {
      throw new Error('code verifier value is empty');
    }
    return verifier;
  } catch (error) {
    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_VerifierError',
      message: {
        errorMessage: error.message,
        accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
        refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
      },
    });
    logger.info({ error, errorMessage: error.message }, 'TokenUtilsError generateCodeVerifier Error');
    /*  istanbul ignore next */
    return tubiDeviceIdClient || TUBI_DEFAULT_DEVICE_ID;
  }
};

/**
 * https://tools.ietf.org/html/rfc7636#appendix-A
 * @param str base64 string
 * @returns a base64 url safe string
 */
export const makeBase64UrlSafe = (str: string) => {
  const encodeChars = {
    '+': '-',
    '/': '_',
  };
  return str.replace(/[+/]/g, (char) => encodeChars[char]);
};

/**
 * generates a string based on the verifier to be used in the signing key request (makeSigningKeyRequest)
 * @param verifier string generated from generateCodeVerifier
 * @returns a base64 url safe verifier string that has been SHA256 hashed
 */
export const generateCodeChallenge = (verifier: string) => {
  try {
    const challenge = makeBase64UrlSafe(SHA256(verifier).toString(Base64Encoder));
    if (!challenge) {
      throw new Error('challenge value is empty');
    }
    return challenge;
  } catch (error) {
    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_ChallengeError',
      message: {
        errorMessage: error.message,
        accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
        refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
      },
    });
    logger.info(error, 'TokenUtilsError generateCodeChallenge Error');
    return '';
  }
};

/**
 * decode the expiration from the JWT access token
 * @param {string} accessToken
 * @returns number | string
 */
export const getExpirationFromToken = (accessToken: string) => {
  try {
    return jwt_decode<TokenPayload>(accessToken).exp;
  } catch (err) {
    return '';
  }
};

/**
 * store access token value and expires in local storage/cookie and in memory
 * @param {string} accessToken
 * @param {number} expires time in seconds until token expires
 */
export const storeAnonymousToken = (accessToken: string, expires: number) => {
  try {
    const exp = getExpirationFromToken(accessToken);
    // store expires date in local storage
    setLocalData(ANONYMOUS_ACCESS_TOKEN_EXPIRES, String(exp));
    tokenData[ANONYMOUS_ACCESS_TOKEN_EXPIRES] = String(exp);
    tokenData[ANONYMOUS_ACCESS_TOKEN] = accessToken;
    setCookie(
      ANONYMOUS_ACCESS_TOKEN,
      accessToken,
      expires,
      ANONYMOUS_ACCESS_TOKEN_PATH,
      getCookieDomain(),
    );
  } catch (error) {
    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
    // istanbul ignore next
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_StoreAnonymousToken',
      message: {
        errorMessage: error.message,
        accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
        refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
      },
    });

    logger.error({ error, errorMessage: error.message }, 'TokenUtilsError storeAnonymousToken Error');
  }
};

/**
 * store refresh token value and expires in local storage and in memory
 * @param refreshToken
 */
export const storeRefreshToken = (refreshToken: string) => {
  try {
    const { exp } = jwt_decode<TokenPayload>(refreshToken);
    // store expires date in local storage
    setLocalData(ANONYMOUS_REFRESH_TOKEN_EXPIRES, String(exp));
    tokenData[ANONYMOUS_REFRESH_TOKEN_EXPIRES] = String(exp);
    setLocalData(ANONYMOUS_REFRESH_TOKEN, refreshToken, convertEpochToSecondsFromCurrentTime(exp));
    tokenData[ANONYMOUS_REFRESH_TOKEN] = refreshToken;
  } catch (error) {
    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_StoreRefreshToken',
      message: {
        errorMessage: error.message,
        accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
        refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
      },
    });
    logger.error({ error, errorMessage: error.message }, 'TokenUtilsError storeRefreshToken Error');
  }
};

/**
 * store base64 encoded client key value in local storage and in memory
 * client key is returned from makeSigningKeyRequest
 * @param clientKey
 */
export const storeBase64ClientKey = (clientKey: string) => {
  setLocalData(TOKEN_BASE64_CLIENT_KEY, clientKey);
  tokenData[TOKEN_BASE64_CLIENT_KEY] = clientKey;
};

/**
 * compares current time to the time the token expires
 * @param tokenExpires seconds from Epoch
 * @returns boolean true if tokenExpires is greater than the current time + a buffer
 */
export const isValidTokenDate = (tokenExpires: number, bufferInSeconds: number = EXPIRE_BUFFER_TIME_SECONDS) => {
  const currentTimeInSeconds = Date.now() / 1000;
  const bufferTime = currentTimeInSeconds + bufferInSeconds;
  return bufferTime < tokenExpires;
};

/**
 * returns in memory value or value from local storage
 * @returns token expires in seconds from Epoch
 */
export const getAnonymousTokenExpiresFromStorage = () => {
  return tokenData[ANONYMOUS_ACCESS_TOKEN_EXPIRES] || getLocalData(ANONYMOUS_ACCESS_TOKEN_EXPIRES);
};

/**
 * returns in memory value or value from local storage
 * @returns token expires in seconds from Epoch
 */
export const getRefreshTokenExpiresFromStorage = () => {
  return tokenData[ANONYMOUS_REFRESH_TOKEN_EXPIRES] || getLocalData(ANONYMOUS_REFRESH_TOKEN_EXPIRES);
};

/**
 * returns in memory value or value from local storage
 * @returns token
 */
export const getRefreshTokenFromStorage = () => {
  return tokenData[ANONYMOUS_REFRESH_TOKEN] || getLocalData(ANONYMOUS_REFRESH_TOKEN);
};

/**
 * returns in memory value or value from local storage
 * @returns client key string
 */
export const getClientKeyFromStorage = () => {
  return tokenData[TOKEN_BASE64_CLIENT_KEY] || getLocalData(TOKEN_BASE64_CLIENT_KEY);
};

/**
 * returns value from cookie
 * @returns access token string
 */
export const getAnonymousTokenFromCookie = () => {
  return getCookie(ANONYMOUS_ACCESS_TOKEN);
};

/**
 * returns in memory value
 * @returns access token string
 */
export const getAnonymousTokenFromMemory = () => {
  return tokenData[ANONYMOUS_ACCESS_TOKEN];
};

/**
 * returns in memory value or value from cookie
 * @returns access token string
 */
export const getAnonymousTokenFromStorage = () => {
  return getAnonymousTokenFromMemory() || getAnonymousTokenFromCookie();
};

/**
 * calls functions to store access/refresh
 * @param tokenResponse response from token request
 */
export const handleTokenResponse = (tokenResponse: TokenResponse) => {
  tokenData[LAST_SUCCESSFUL_ANONYMOUS_TOKEN_RESPONSE] = tokenResponse;
  storeAnonymousToken(tokenResponse.access_token, tokenResponse.expires_in);
  storeRefreshToken(tokenResponse.refresh_token);
};

export const handleTokenRefreshedOnNative = (params: RefreshedToken) => {
  // Guest users
  if (params.user_id === 0) {
    // We need the expires_in in seconds, but the android team pass an absolute time in milliseconds to us.
    // Convert from absolute time in milliseconds to relative time in seconds
    params.expires_in = (params.expires_in - Date.now()) / 1000;
    handleTokenResponse(pick(params, ['access_token', 'refresh_token', 'expires_in']));
  }
};

/**
 * Set deviceId
 */
export const setDeviceIdForTokenRequests = (deviceId?: string) => {
  if (deviceId) {
    tubiDeviceIdClient = deviceId;
  }
};

/**
 * removes in memory anonymous token data and local storage/cookie token data
 */
export const clearAnonymousTokens = () => {
  if (__CLIENT__) {
    removeLocalData(ANONYMOUS_ACCESS_TOKEN_EXPIRES);
    removeLocalData(ANONYMOUS_REFRESH_TOKEN_EXPIRES);
    removeLocalData(ANONYMOUS_REFRESH_TOKEN);
    removeLocalData(TOKEN_BASE64_CLIENT_KEY);
    removeCookie(ANONYMOUS_ACCESS_TOKEN, ANONYMOUS_ACCESS_TOKEN_PATH);
  }
  tokenData = { ...initialTokenData };
};

/**
 * makes request to signing key endpoint
 * @param verifierStr generated from generateCodeVerifier
 * @param deviceId
 * @returns returns response from endpoint `config.userTokenRoutes.signingKey`
 */
export const makeSigningKeyRequest = async (verifierStr?: string, deviceId: string = tubiDeviceIdClient): Promise<SigningKeyResponse | null | ResponseError.HAS_CORS_ERROR> => {
  const client = getApiClient();
  try {
    let verifier = verifierStr;
    if (!verifier) {
      verifier = generateCodeVerifier();
    }

    const challenge = generateCodeChallenge(verifier!);
    if (!challenge) {
      throw new Error('challenge value is empty');
    }

    if (!deviceId) {
      logger.error('TokenUtilsError makeSigningKeyRequest Error: DEVICE ID EMPTY, using default');
      deviceId = TUBI_DEFAULT_DEVICE_ID;
    }

    const signingKeyPayload: SigningKeyPayload = {
      challenge,
      version: TUBI_CLIENT_VERSION,
      platform: TUBI_PLATFORM,
      device_id: deviceId,
    };

    const body = await client.post(config.userTokenRoutes.signingKey, {
      data: { ...signingKeyPayload },
    });
    return body;
  } catch (error) {
    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
    // istanbul ignore next
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_SigningKey',
      message: {
        errorMessage: error.message,
        error: error.status || error.httpCode,
        accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
        refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
        userAgent: typeof navigator !== 'undefined' && navigator.userAgent,
        pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
      },
    });

    /* istanbul ignore next */
    logger.info(error.response && error.response.body || error, 'TokenUtilsError makeSigningKeyRequest Error');

    // return HAS_CORS_ERROR if the request fails due to CORS issue
    /* istanbul ignore next */
    if (__CLIENT__ && !error.status && !error.httpCode && error.message.includes('Origin is not allowed') && !isMajorEventFailsafeActive()) {
      // If there is a CORS/Network error (HTTP status code 0), try to log to client and capture the error
      try {
        trackLogging({
          type: 'CLIENT:INFO',
          level: 'info',
          subtype: 'anonError_CORS',
          message: {
            message: error.message,
            errorStatus: error.status || error.httpCode,
          },
        });
      } catch (error) {
        // CORS/NETWORK error posting to client logs
        client.sendBeacon('/oz/log', {
          data: {
            errorStatus: error.status || error.httpCode,
            errorMessage: error.message,
            customLogMessage: 'Client log request failed',
          },
        });
      }
      return ResponseError.HAS_CORS_ERROR;
    }

    return null;
  }
};

/**
 * makes request to anonymous auth token endpoint
 * @param params
 * @param queryParams
 * @returns response from `config.userTokenRoutes.token`
 */
export const makeAnonymousTokenRequest = async (params: AnonymousTokenParams, queryParams: AnonymousTokenQueryParams): Promise<TokenResponse | null> => {
  const client = getApiClient();
  try {
    const body = await client.post(config.userTokenRoutes.token, {
      data: { ...params },
      params: queryParams as unknown as Record<string, string>,
    });
    return body;
  } catch (error) {
    /* istanbul ignore next */
    let errorObj: any = error.response && error.response.body || error;
    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
    // testing if device is able to set cookies via javascript
    /* istanbul ignore next */
    setCookie('tokenTest', 'tokenTest', 60);
    /* istanbul ignore next */
    const testCookie = getCookie('tokenTest');
    /* istanbul ignore next */
    errorObj = {
      errorMessage: error.message,
      errorStatus: error.status || error.httpCode,
      accessTokenExpires: `${getAnonymousTokenExpiresFromStorage()}`,
      refreshTokenExpires: `${getRefreshTokenExpiresFromStorage()}`,
      canSetCookie: `${!!testCookie}`,
      cookiesEnabled: `${typeof navigator !== 'undefined' && navigator.cookieEnabled}`,
      userAgent: typeof navigator !== 'undefined' && navigator.userAgent,
      localStorage: `${supportsLocalStorage()}`,
      pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
    };
    /* istanbul ignore next */
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_AnonymousTokenError',
      message: errorObj,
    });

    if ((error.status || error.httpCode) === 404) {
      const lastToken = tokenData[LAST_SUCCESSFUL_ANONYMOUS_TOKEN_RESPONSE];
      /* istanbul ignore else */
      if (lastToken) {
        logger.info(errorObj, 'TokenUtilsError makeAnonymousTokenRequest Error - use last token on 404');
        return lastToken;
      }
    }

    logger.info(errorObj, 'TokenUtilsError makeAnonymousTokenRequest Error');
    return null;
  }
};

/**
 * makes request to refresh anonymous token endpoint
 * @param queryParams
 * @param refreshToken
 * @returns response from `config.userTokenRoutes.refreshToken
 */
export const makeRefreshAnonymousTokenRequest = async (queryParams: AnonymousTokenQueryParams, refreshToken: string): Promise<TokenResponse | null> => {
  const client = getApiClient();
  try {
    const body = await client.post(config.userTokenRoutes.refreshToken, {
      data: { platform: TUBI_PLATFORM },
      params: queryParams as unknown as Record<string, string>,
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    });
    return body;
  } catch (error) {
    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
    /* istanbul ignore next */
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_RefreshTokenError',
      message: {
        errorMessage: error.message,
        errorStatus: error.status || error.httpCode,
        accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
        refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
      },
    });
    /* istanbul ignore next */
    logger.info({
      error: error.response && error.response.body || error,
      errorMessage: error.message,
      errorStatus: error.status || error.httpCode,
    }, 'TokenUtilsError makeRefreshAnonymousTokenRequest Error');
    return null;
  }
};

/**
 * hashing/encryption logic docs https://docs.google.com/document/d/1qN7hnHdgCya5ekjiFwFoeaJukt3x_I0__hakq0oPZes/edit#
 * builds the query params for the anonymous token endpoint
 * @param anonymousTokenPayload
 * @param clientKey
 * @param canonicalRequestUrl
 * @returns object that is passed as url params to the token endpoints
 */
export const buildAnonymousTokenQueryParams = (
  anonymousTokenPayload: AnonymousTokenParams | '',
  clientKey: CryptoJS.lib.WordArray,
  canonicalRequestUrl: string,
): AnonymousTokenQueryParams => {
  const canonicalHeaders = 'content-type:application/json\n';

  let payload = JSON.stringify(anonymousTokenPayload);
  payload = SHA256(payload).toString(HexEncoder).toLowerCase();

  const canonicalRequest = `POST\n${canonicalRequestUrl}\n\n${canonicalHeaders}\n${TUBI_SIGNED_HEADERS}\n${payload}`;

  const hashedCanonicalRequest = SHA256(canonicalRequest).toString(HexEncoder).toLowerCase();

  const isoDate = getDateISO();

  const stringToSign = `${TUBI_ALGORITHM}\n${isoDate}\n${hashedCanonicalRequest}`;

  let clientKeyArray = Utf8Encoder.parse(TUBI_CLIENT_KEY_STATIC_VALUE);
  clientKeyArray = clientKeyArray.concat(clientKey);

  let derivedKey: CryptoJS.lib.WordArray = HmacSHA256(isoDate.split('T')[0], clientKeyArray);
  derivedKey = HmacSHA256(TUBI_DERIVED_KEY_MESSAGE, derivedKey);

  const signature = HmacSHA256(stringToSign, derivedKey).toString(HexEncoder);

  return {
    'X-Tubi-Algorithm': TUBI_ALGORITHM,
    'X-Tubi-Date': isoDate,
    'X-Tubi-Expires': TOKEN_REQUEST_EXPIRE_TIME,
    'X-Tubi-SignedHeaders': TUBI_SIGNED_HEADERS,
    'X-Tubi-Signature': signature,
  };
};

/**
 * makes signing key request to build correct query params then makes call to anonymous auth token endpoint
 * @param deviceId
 * @returns token request response (makeAnonymousTokenRequest)
 */
export const getAndStoreTokensFromAuthServer = async (deviceId?: string): Promise<TokenResponse | ResponseError | null> => {
  try {
    const verifier = generateCodeVerifier();

    const signingKeyResponse = await makeSigningKeyRequest(verifier, deviceId);
    if (!signingKeyResponse) {
      return null;
    }
    /* istanbul ignore next */
    if (signingKeyResponse === ResponseError.HAS_CORS_ERROR) {
      throw new Error(ResponseError.HAS_CORS_ERROR);
    }

    const clientId = signingKeyResponse.id;
    const clientKey = Base64Encoder.parse(signingKeyResponse.key);
    if (__CLIENT__) {
      storeBase64ClientKey(signingKeyResponse.key);
    }

    const anonymousTokenPayload = {
      verifier,
      id: clientId,
      platform: TUBI_PLATFORM,
      device_id: deviceId || tubiDeviceIdClient,
    };

    const queryParams = buildAnonymousTokenQueryParams(anonymousTokenPayload, clientKey, TUBI_CANONICAL_REQUEST_TOKEN_URL);
    const anonymousTokenResponse = await makeAnonymousTokenRequest(anonymousTokenPayload, queryParams);

    if (!anonymousTokenResponse) {
      return null;
    }
    if (__CLIENT__) {
      handleTokenResponse(anonymousTokenResponse);
      if (__IS_HYB_APP__) {
        notifyAnonymousTokenChange({ ...anonymousTokenResponse, ...signingKeyResponse });
      }
    }
    return anonymousTokenResponse;
  } catch (error) {
    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
    // istanbul ignore next
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_GetAndStoreToken',
      message: {
        errorMessage: error.message,
        error: error.status || error.httpCode,
        accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
        refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
      },
    });

    logger.info({
      errorMessage: error.message,
      errorStatus: error.status || error.httpCode,
    }, 'TokenUtilsError getTokensFromAuthServer Error');

    // return HAS_CORS_ERROR if the request fails due to CORS issue
    /* istanbul ignore next */
    if (error.message === ResponseError.HAS_CORS_ERROR) {
      return ResponseError.HAS_CORS_ERROR;
    }

    return null;
  }
};

declare global {
  namespace Express {
    interface Request {
      anonymousTokenPromiseHolder?: Promise<TokenResponse | ResponseError.HAS_CORS_ERROR | null> | null
    }
  }
}

/**
 * Stores the server token generation function as a property on the Express request object
 *
 * Similar logic to syncTokensHandler, which is used on the client side
 *
 * This will prevent duplicate calls to the token API in cases where this function is called
 * simultaneously or in rapid succession
 */
/* istanbul ignore next */
export const syncAnonymousTokenOnServer = async (req: express.Request) => {
  try {
    if (!req.anonymousTokenPromiseHolder) {
      req.anonymousTokenPromiseHolder = syncAnonymousTokenOnServerExec(req);
      const response = await req.anonymousTokenPromiseHolder;
      req.anonymousTokenPromiseHolder = null;
      return response;
    }
    const response = await req.anonymousTokenPromiseHolder;
    return response;
  } catch (error) {
    logger.error(error, 'TokenUtilsError syncAnonymousTokenOnServerPromise');
    return null;
  }
};

/**
 * contains logic to generate new tokens if there are no existing ones or tokens are expired
 * called from the server side
 * @param req
 * @returns returns anonymous auth token response `makeAnonymousTokenRequest`
 */
export const syncAnonymousTokenOnServerExec = async (req: express.Request) => {
  if (!req || req.user) {
    return null;
  }
  const deviceId = req.deviceId || req.cookies[COOKIE_DEVICE_ID];
  let shouldGetNewToken = false;

  try {
    const aToken = req.cookies[ANONYMOUS_ACCESS_TOKEN];
    if (aToken) {
      const { exp } = jwt_decode<TokenPayload>(aToken);
      if (!isValidTokenDate(exp)) {
        shouldGetNewToken = true;
      }
    } else {
      shouldGetNewToken = true;
    }
    if (shouldGetNewToken) {
      const authResponse = await getAndStoreTokensFromAuthServer(deviceId);
      if (!authResponse) {
        throw new Error('getAndStoreTokensFromAuthServer response empty');
      }
      return authResponse;
    }
    return null;
  } catch (error) {
    // retry logic for refresh token
    for (let index = 0; index < TOKEN_REQUEST_MAX_RETRY_COUNT; index++) {
      try {
        // eslint-disable-next-line
        await delay(TOKEN_REQUEST_RETRY_DELAY_MS);
        // eslint-disable-next-line
        const authResponse = await getAndStoreTokensFromAuthServer(deviceId);
        if (!authResponse) {
          throw new Error('getAndStoreTokensFromAuthServer response empty');
        }
        return authResponse;
      } catch (error) {
        const errorObj = {
          errorMessage: error.message,
          errorStatus: error.status || error.httpCode,
        };
        logger.info(errorObj, `TokenUtilsError syncAnonymousTokenOnServer retry failed, count ${index + 1}`);
      }
    }
    return null;
  }
};

/**
 * contains logic to generate new tokens if there are no existing ones or tokens are expired
 * called from the client side
 */
export const syncAnonymousTokensClientExec = async () => {
  try {
    const accessTokenExpires = getAnonymousTokenExpiresFromStorage();
    // access token is valid, do nothing as it is stored in a cookie
    if (accessTokenExpires && isValidTokenDate(Number(accessTokenExpires)) && getAnonymousTokenFromStorage()) {
      return;
    }
    // access token is expired
    const refreshTokenExpires = getRefreshTokenExpiresFromStorage();
    const refreshToken = getRefreshTokenFromStorage();
    const clientKey = getClientKeyFromStorage();

    // refresh token is not expired, call refresh token endpoint
    if (refreshTokenExpires && isValidTokenDate(Number(refreshTokenExpires)) && refreshToken && clientKey) {
      // get client key from localStorage

      // clientKey is stored as base64 string
      const clientKeyArr = Base64Encoder.parse(clientKey as string);
      const queryParams = buildAnonymousTokenQueryParams(
            { platform: TUBI_PLATFORM } as AnonymousTokenParams,
            clientKeyArr, TUBI_CANONICAL_REQUEST_REFRESH_URL
      );
      const anonymousTokenResponse = await makeRefreshAnonymousTokenRequest(queryParams, refreshToken as string);
      if (anonymousTokenResponse) {
        handleTokenResponse(anonymousTokenResponse);
        if (__IS_HYB_APP__) {
          notifyAnonymousTokenChange({ ...anonymousTokenResponse, key: clientKey });
        }
      } else {
        const authResponse = await getAndStoreTokensFromAuthServer();
        /* istanbul ignore else */
        if (!authResponse) {
          throw Error('getAndStoreTokensFromAuthServer response empty');
        }
        /* istanbul ignore next */
        if (authResponse === ResponseError.HAS_CORS_ERROR) {
          throw new Error(ResponseError.HAS_CORS_ERROR);
        }
      }
    // refresh token is expired or does not exist, get new set of tokens
    } else {
      // additional temporary logging
      /* istanbul ignore next */
      if (!refreshToken && clientKey) {
        trackLogging({
          type: 'CLIENT:INFO',
          level: 'info',
          subtype: 'anonError_rt_missing',
          message: {
            accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
            refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
            getAnonymousTokenFromMemory: !!getAnonymousTokenFromStorage(),
            pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
          },
        });
      }
      // additional temporary logging
      /* istanbul ignore next */
      if (!clientKey && refreshToken) {
        trackLogging({
          type: 'CLIENT:INFO',
          level: 'info',
          subtype: 'anonError_ck_missing',
          message: {
            accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
            refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
            getAnonymousTokenFromMemory: !!getAnonymousTokenFromStorage(),
            pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
          },
        });
      }
      const authResponse = await getAndStoreTokensFromAuthServer();
      /* istanbul ignore else */
      if (!authResponse) {
        throw new Error('getAndStoreTokensFromAuthServer response empty');
      }
      /* istanbul ignore next */
      if (authResponse === ResponseError.HAS_CORS_ERROR) {
        throw new Error(ResponseError.HAS_CORS_ERROR);
      }
    }
  } catch (error) {
    /* istanbul ignore next */
    const retryCount = error.message !== ResponseError.HAS_CORS_ERROR ? TOKEN_REQUEST_MAX_RETRY_COUNT : 0;
    // retry logic for refresh token
    // @TODO cbengtson, clean up error handling logic
    for (let index = 0; index < retryCount; index++) {
      try {
        // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
        // istanbul ignore next
        trackLogging({
          type: 'CLIENT:INFO',
          level: 'info',
          subtype: 'anonError_SyncTokensRetry',
          message: {
            errorMessage: error.message,
            errorStatus: error.status || error.httpCode,
            accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
            refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
            retryCount: index + 1,
          },
        });

        // eslint-disable-next-line
        await delay(TOKEN_REQUEST_RETRY_DELAY_MS);

        /* istanbul ignore next */
        clearAnonymousTokens();

        // eslint-disable-next-line
        const authResponse = await getAndStoreTokensFromAuthServer();
        /* istanbul ignore else */
        if (!authResponse) {
          throw new Error('getAndStoreTokensFromAuthServer response empty');
        }
        break;
      } catch (error) {
        logger.error(error, `TokenUtilsError syncAnonymousTokensClient retry count ${index + 1} Error: `);
      }
    }

    // TEMPORARY LOGGING FOR ANONYMOUS TOKEN ON FIRETV_HYB, WILL BE REMOVED
    // istanbul ignore next
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: 'anonError_SyncTokensClientErr',
      message: {
        errorMessage: error.message,
        errorStatus: error.status || error.httpCode,
        accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
        refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
        pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
      },
    });
  }
};

let syncTokenPromiseHolder: {
  pendingPromise: Promise<void>
  timeOfExecution: Date
} | null = null;

/**
 * Calls syncFn (promise) which contains the token generation logic
 *
 * Stores syncFn promise in a variable and calls the existing promise if
 * this function is called again before the promise is finished
 *
 * This will prevent duplicate calls to the token API in cases where this function is called
 * simultaneously or in rapid succession
 */
/* istanbul ignore next */
export const syncTokensHandler = async (syncFn: () => Promise<void>, errType?: string) => {
  try {
    // If the promise holder variable, or pendingPromise or timeOfExecution is empty
    // call the syncFn function to generate token and store the promise in the variable
    if (!syncTokenPromiseHolder
      || !syncTokenPromiseHolder.pendingPromise
      || !syncTokenPromiseHolder.timeOfExecution
      || timeDiffInSeconds(syncTokenPromiseHolder.timeOfExecution, new Date()) > FORCE_NEW_ACCESS_TOKEN_AFTER_TIME
    ) {
      syncTokenPromiseHolder = {
        pendingPromise: syncFn(),
        timeOfExecution: new Date(),
      };
      await syncTokenPromiseHolder.pendingPromise;
      syncTokenPromiseHolder = null;
    } else {
      await syncTokenPromiseHolder.pendingPromise;
    }
  } catch (error) {
    // istanbul ignore next
    trackLogging({
      type: 'CLIENT:INFO',
      level: 'info',
      subtype: errType || 'error_SyncPromise',
      message: {
        errorMessage: error.message,
        errorStatus: error.status || error.httpCode,
        accessTokenExpires: getAnonymousTokenExpiresFromStorage(),
        refreshTokenExpires: getRefreshTokenExpiresFromStorage(),
        pageUrl: typeof window !== 'undefined' && window.location ? window.location.href : null,
      },
    });
  }
};

export const syncAnonymousTokensClient = async () => {
  await syncTokensHandler(syncAnonymousTokensClientExec, 'anonError_SyncPromise');
};

export const addAnonymousTokensToAuthHeaders = (req: express.Request, options: any) => {
  if (req.headers[SERVER_ANONYMOUS_ACCESS_TOKEN]) {
    options.auth = {
      bearer: req.headers[SERVER_ANONYMOUS_ACCESS_TOKEN],
    };
  } else if (req.cookies[ANONYMOUS_ACCESS_TOKEN]) {
    options.auth = {
      bearer: req.cookies[ANONYMOUS_ACCESS_TOKEN],
    };
  } else if (req.headers[ANONYMOUS_TOKEN_CLIENT_HEADER_NAME]) {
    options.auth = {
      bearer: req.headers[ANONYMOUS_TOKEN_CLIENT_HEADER_NAME],
    };
  }
};

export const anonymousTokenRetryCallback = (error: AuthError) => {
  const errorCode = error.status || error.httpCode;
  if (errorCode === 401 || errorCode === 403) {
    clearAnonymousTokens();
  }
};

export const getAnonymousTokenRequestOptions = (useAnonymousToken: boolean = true):
  {
    retryCount?: number,
    retryIncludedStatusCodes?: number[],
    retryCallback?: (error: AuthError) => void,
    retryCodes?: string[],
    retryScalingDuration?: number,
    useAnonymousToken?: boolean,
  } => {
  if (useAnonymousToken) {
    return {
      retryCount: TOKEN_REQUEST_MAX_RETRY_COUNT,
      retryIncludedStatusCodes: [401, 403],
      retryCallback: anonymousTokenRetryCallback,
      retryCodes: REGENERATE_TOKEN_CODES,
      retryScalingDuration: ANONYMOUS_TOKEN_RETRY_SCALING_DURATION,
      useAnonymousToken,
    };
  }
  return {};
};

/**
 * Helper function to determine if token is expired or about to expire
 */
export const isTokenExpired = (tokenExpiresAt?: Date) => {
  const nowTime = new Date().getTime();
  const tokenExpiresAtTime = new Date(tokenExpiresAt ?? '').getTime();

  return tokenExpiresAtTime < nowTime + ONE_HOUR;
};
