export const ACTIVATION_CODE_QUERY_PARAM = 'code';
export const ACTIVATION_FLOW_QUERY_PARAM = 'from';
export const ACTIVATION_CODE_OPTION_PARAM = 'option';

export const AUTH_ENDPOINT_TIMEOUT_MS = 6000;

export const STATUS_REQUEST_INTERVAL_IN_MS = 2000;
export const STATUS_REQUEST_INTERVAL_IN_MS_MAJOR_EVENT = 5000;

// Please refer to the possible error responses from
// https://docs.tubi.io/api_docs/account#operations-User-post-user_device-signup
export const COPPA_ERROR_STATUS = {
  BELOW_MIN_AGE: 422,
  LEGAL: 451,
};

export const USER_NOT_FOUND_ERROR = {
  STATUS_CODE: 401,
  CODE: 'USER_NOT_FOUND',
};

export const LOGIN_REQUIRED_ERROR = {
  STATUS_CODE: 401,
  CODE: 'LOGIN_REQUIRED',
};

export const COPPA_ERROR_STATUS_CODES = Object.values(COPPA_ERROR_STATUS);

export enum GOOGLE_LOGIN_METHOD {
  SIGNIN_WITH_GOOGLE = 'SIGNIN_WITH_GOOGLE',
  GOOGLE_ONE_TAP = 'GOOGLE_ONE_TAP',
}

export const EXPIRED_ERROR_MESSAGE = 'Status check expired';
