import type { AuthType } from '@tubitv/analytics/lib/baseTypes';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { ValueOf } from 'ts-essentials';

import type * as actions from 'common/constants/action-types';
import type { TubiThunkAction } from 'common/types/reduxThunk';
import type { RouteCode } from 'common/types/route-codes';

export interface User {
  email?: string;
  hasPassword?: boolean;
  name?: string;
  userId: number;
  token?: string;
  status?: string;
  authType?: AuthType;
  hasAge?: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  tokenExpiration?: Date;
  expiresIn?: number;
}

export type AuthThunk<ReturnType> = TubiThunkAction<ThunkAction<ReturnType, unknown, unknown, AnyAction>>;

export type AuthErrorData = {
  status: number;
  message: string;
  httpCode?: number;
  routeCode?: RouteCode;
  code?: string;
};

export type AuthError = Error & AuthErrorData;

export interface AuthErrorLocationState {
  isDelayedRegistration: 'true' | 'false'; // true if error status is 503 with code ACCOUNT_PENDING_PROCESSING
  type: 'activate' | 'magicLink' | 'signIn' | 'signUp';
}

/**
 * @param err - error object, or null if no error
 * @param user - user object, or false if no user
 */
export type AuthDone = (err: Error | null, user: User | false, info?: { message: string }) => void;

export enum UserCoppaStates {
  REQUIRE_AGE_GATE = 'REQUIRE_AGE_GATE', // User age is unknown
  REQUIRE_LOGOUT = 'REQUIRE_LOGOUT', // User is too young (international), needs to be logged out for legal reasons
  NOT_COMPLIANT = 'NOT_COMPLIANT', // User is below 13 years old, requires logout and kids mode
  COMPLIANT = 'COMPLIANT', // User is 13 years old or older
}

export type AgeGateData = {
  birthMonth: string;
  birthDay: string;
  birthYear: string;
  gender?: string;
};

/**
 * When the email type is pre_fill, account service won't send the verification email and will designate the user as verified;
 * however, when the email type is manual, the verification email is sent.
 */
export const EmailType = {
  PRE_FILL: 'pre_fill',
  MANUAL: 'manual',
} as const;

type EmailTypeValue = ValueOf<typeof EmailType>;

export type CredentialsData = {
  firstName: string;
  password: string;
  password2?: string;
  email: string;
  emailType: EmailTypeValue;
  registrationUID?: string;
};

type UserSettingsData = {
  personalizedEmails: boolean;
};

export interface RequestActivationCodeResponse {
  activation_code: string;
  activation_token: string;
  qr_code_data_url?: string;
}

export interface OttActivationCodeStatusResponse {
  token?: string;
  refreshToken?: string;
  userId?: number;
  status: 'pending' | 'registered';
  hasAge?: boolean;
}

export interface RequestMagicLinkResponse {
  uid: string;
}

export interface MagicLinkStatusRegisteredResponse {
  token?: string;
  refreshToken?: string;
  userId?: number;
  status: 'REGISTERED';
  hasAge?: boolean;
  authType: 'EMAIL';
}

export interface UserCredentials {
  firstName?: string;
  email: string;
  emailType: EmailTypeValue;
  password?: string;
  amazonName?: string;
  amazonAccessToken?: string;
}

export interface RegistrationData extends CredentialsData, AgeGateData, UserSettingsData {
}

interface LoginCallbackResult {
  cancelGoBack: boolean;
}
// The following is a starting point, created quickly
// from the initial state for the reducer. As we start
// to use these, we should flesh out the definitions,
// especially for things like {}, unknown, making
// properties optional where necessary, and
// adding "| null" if nullable.
export interface AuthState {
  loaded: boolean;
  ottActivationCodePending: boolean;
  ottActivationCodeFailError?: unknown | null;
  ottActivationQRCodeDataURL?: string | null;
  loading?: boolean;
  /**
   * looks weird, but temporarily in our auth flow, when a user signs in with OTT Activation, temporarily user key
   * stores the OttActivationCodeStatusResponse
   * FIXME: I discussed it with @longjucheng, we both think the typing here should be "User | null".
   * The successful activation code status response (https://docs.tubi.io/api_docs/account#operations-activation-code-post-user_device-code-status)
   * is is either a User payload or '{ "status": "pending" }'. When when it returns a pending status, the value will
   * not be stored in auth.user here. So, we should fix the typing and remove the dependency of OttActivationCodeStatusResponse.
   */
  user?: LoginSuccessResult | null;
  error?: AuthError;
  loggingIn?: boolean;
  loggingOut?: boolean;
  loginError?: unknown | null;
  logoutError?: unknown | null;
  deviceId?: string;
  /**
   * @NOTE For FireTV devices, the timestamp will not reflect any dates before September 2024.
   * Previously, the timestamp value was not set correctly, making the exact initialization time unknown until we resolved this issue in Sept 2024.
   * This timestamp problem is exclusive to FireTV; timestamps work well on other platforms.
   */
  firstSeen?: string;
  password?: string | null;
  passwordExpiryTime?: number | null;
  ottActivationCode?: string;
  ottActivationToken?: string;
  loginCallback?: (() => LoginCallbackResult | void) | null;
  loginRedirect?: string;
  onLoginCanceled?: VoidFunction | null;
  userIP?: string;
  userCredentials: UserCredentials | null;
  lastMagicLinkUID?: string | null;
  ottActivationTimestamp?: number;
  ottOneTapPending?: boolean;
}

// actions with a type key and some other key
export type AuthAction =
  AuthFailAction |
  AuthSuccessAction |
  SetUserIpAction |
  SetUserDeviceIdAction |
  SetUserDeviceFirstSeenAction |
  OttRequestActivationCodePendingAction |
  OttSetActivationCodeTokenAction |
  OttClearActivationCodeTokenAction |
  SetLoginCallbackAction |
  SetLoginRedirectAction |
  SetLoginCanceledCallbackAction |
  StoreParentalPasswordAction |
  SimpleAuthAction |
  StoreUserCredentials |
  SetLastMagicLinkUID |
  OttOneTapPendingAction;

type AuthSuccessActionNames = typeof actions.EMAIL_REGISTRATION_SUCCESS |
  typeof actions.LOAD_AUTH_SUCCESS |
  typeof actions.LOGIN_SUCCESS |
  typeof actions.CHANGE_PASSWORD_SUCCESS |
  typeof actions.UPDATE_USER;

export type LoginSuccessResult = User | OttActivationCodeStatusResponse | Omit<OttActivationCodeStatusResponse, 'status'>;
export interface AuthSuccessAction {
  type: AuthSuccessActionNames;
  result: LoginSuccessResult;
}

type AuthFailActionNames = typeof actions.EMAIL_REGISTRATION_FAIL |
  typeof actions.LOAD_AUTH_FAIL |
  typeof actions.LOGIN_FAIL |
  typeof actions.LOGOUT_FAIL;

export interface AuthFailAction {
  type: AuthFailActionNames;
  error: AuthError;
}

export interface SetUserIpAction {
  type: typeof actions.SET_USER_IP;
  ipAddress: string;
}

export interface SetUserDeviceIdAction {
  type: typeof actions.SET_USER_DEVICE_ID;
  deviceId?: string;
}

export interface SetUserDeviceFirstSeenAction {
  type: typeof actions.SET_USER_DEVICE_FIRST_SEEN;
  firstSeen?: string;
}

interface OttRequestActivationCodePendingAction {
  type: typeof actions.OTT_REQUEST_ACTIVATION_CODE_PENDING;
  status: boolean;
  error: unknown | null;
}

interface OttSetActivationCodeTokenAction {
  type: typeof actions.OTT_SET_ACTIVATION_CODE_TOKEN;
  ottActivationCode: string;
  ottActivationToken: string;
  ottActivationQRCodeDataURL?: string;
  ottActivationTimestamp?: number;
}

export interface OttClearActivationCodeTokenAction {
  type: typeof actions.OTT_CLEAR_ACTIVATION_CODE_TOKEN;
}

export interface SetLoginCallbackAction {
  type: typeof actions.SET_LOGIN_CALLBACK;
  callback: (() => LoginCallbackResult | void) | null;
}

export interface SetLoginRedirectAction<T = string> {
  type: typeof actions.SET_LOGIN_REDIRECT;
  redirectUrl: T;
}

export interface SetLoginCanceledCallbackAction {
  type: typeof actions.SET_LOGIN_CANCELED_CALLBACK;
  callback: VoidFunction | null;
}

export interface StoreParentalPasswordAction {
  type: typeof actions.STORE_PARENTAL_PASSWORD;
  password: string;
}

export interface StoreUserCredentials {
  type: typeof actions.STORE_USER_CREDENTIALS;
  userCredentials: UserCredentials;
}

interface SetLastMagicLinkUID {
  type: typeof actions.SET_LAST_MAGIC_LINK_UID;
  lastMagicLinkUID: string | null;
}

interface OttOneTapPendingAction {
  type: typeof actions.OTT_ONE_TAP_PENDING;
  status: boolean;
}

// actions with only a type key
export interface SimpleAuthAction {
  type: typeof actions.EMAIL_REGISTRATION |
  typeof actions.LOAD_AUTH |
  typeof actions.LOGIN |
  typeof actions.CLEAR_LOGIN_ERROR |
  typeof actions.CLEAR_LOGIN_ACTIONS |
  typeof actions.LOGOUT |
  typeof actions.LOGOUT_SUCCESS |
  typeof actions.CLEAR_PARENTAL_PASSWORD |
  typeof actions.REMOVE_USER_CREDENTIALS |
  typeof actions.RESET_AUTH;
}

export interface UAPIAuthResponse {
  user_id: number;
  access_token: string;
  facebook_id: string;
  name: string;
  first_name: string;
  email: string;
  refresh_token: string;
  expires_in: number;
  status: string;
  has_password: boolean;
  has_age: boolean;
  message?: string;
}

export type ShouldCancelCallback = boolean | void; // return true to prevent default handling
