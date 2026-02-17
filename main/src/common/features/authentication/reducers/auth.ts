import * as actions from 'common/constants/action-types';
import type { AuthAction, AuthState, AuthSuccessAction } from 'common/features/authentication/types/auth';

export const initialState: AuthState = {
  loaded: false,
  ottActivationCodePending: false,
  userCredentials: null,
};

export default function reducer(state: AuthState = initialState, action?: AuthAction): AuthState {
  if (!action) {
    return state;
  }
  switch (action.type) {
    case actions.EMAIL_REGISTRATION:
    case actions.LOAD_AUTH:
      return {
        ...state,
        loading: true,
      };
    case actions.EMAIL_REGISTRATION_SUCCESS:
    case actions.LOAD_AUTH_SUCCESS:
      return {
        ...state,
        loading: false,
        loaded: true,
        user: action.result,
      };
    case actions.EMAIL_REGISTRATION_FAIL:
    case actions.LOAD_AUTH_FAIL:
      return {
        ...state,
        loading: false,
        loaded: false,
        error: action.error,
      };
    case actions.LOGIN:
      return {
        ...state,
        loggingIn: true,
      };
    case actions.LOGIN_SUCCESS:
      return {
        ...state,
        loggingIn: false,
        user: action.result,
        loginError: null,
      };
    case actions.LOGIN_FAIL:
      return {
        ...state,
        loggingIn: false,
        user: null,
        loginError: action.error,
      };
    case actions.SET_USER_IP:
      return {
        ...state,
        userIP: action.ipAddress,
      };
    case actions.SET_USER_DEVICE_ID:
      return {
        ...state,
        deviceId: action.deviceId,
      };
    case actions.SET_USER_DEVICE_FIRST_SEEN:
      return {
        ...state,
        firstSeen: action.firstSeen,
      };
    case actions.CLEAR_LOGIN_ERROR:
      return {
        ...state,
        loginError: null,
      };
    case actions.OTT_REQUEST_ACTIVATION_CODE_PENDING:
      return {
        ...state,
        ottActivationCodePending: action.status,
        ottActivationCodeFailError: action.error || null,
      };
    case actions.OTT_SET_ACTIVATION_CODE_TOKEN:
      return {
        ...state,
        ottActivationCode: action.ottActivationCode,
        ottActivationToken: action.ottActivationToken,
        ottActivationQRCodeDataURL: action.ottActivationQRCodeDataURL,
        ottActivationTimestamp: action.ottActivationTimestamp,
      };
    case actions.OTT_CLEAR_ACTIVATION_CODE_TOKEN:
      return {
        ...state,
        ottActivationCode: undefined,
        ottActivationToken: undefined,
        ottActivationQRCodeDataURL: undefined,
        ottActivationTimestamp: undefined,
      };
    case actions.SET_LOGIN_CALLBACK:
      return {
        ...state,
        loginCallback: action.callback,
      };
    case actions.SET_LOGIN_REDIRECT:
      return {
        ...state,
        loginRedirect: action.redirectUrl,
      };
    case actions.SET_LOGIN_CANCELED_CALLBACK:
      return {
        ...state,
        onLoginCanceled: action.callback,
      };
    case actions.CLEAR_LOGIN_ACTIONS:
      return {
        ...state,
        loginRedirect: undefined,
        loginCallback: null,
        onLoginCanceled: null,
      };
    case actions.LOGOUT:
      return {
        ...state,
        loggingOut: true,
      };
    case actions.LOGOUT_SUCCESS:
      return {
        ...state,
        loggingOut: false,
        user: null,
        logoutError: null,
      };
    case actions.LOGOUT_FAIL:
      return {
        ...state,
        loggingOut: false,
        logoutError: action.error,
      };
    case actions.STORE_PARENTAL_PASSWORD:
      return {
        ...state,
        password: action.password,
        passwordExpiryTime: Date.now() + 1000 * 60 * 5, // expires in 5 mins
      };
    case actions.CLEAR_PARENTAL_PASSWORD:
      return {
        ...state,
        password: null,
        passwordExpiryTime: null,
      };
    case actions.STORE_USER_CREDENTIALS:
      const { userCredentials } = action;
      return {
        ...state,
        userCredentials,
      };
    case actions.REMOVE_USER_CREDENTIALS:
      return {
        ...state,
        userCredentials: null,
      };
    case actions.SET_LAST_MAGIC_LINK_UID:
      return {
        ...state,
        lastMagicLinkUID: action.lastMagicLinkUID,
      };
    case actions.RESET_AUTH: {
      return {
        ...state,
        error: undefined,
        loading: undefined,
        user: undefined,
        ...initialState,
      };
    }
    case actions.OTT_ONE_TAP_PENDING: {
      return {
        ...state,
        ottOneTapPending: action.status,
      };
    }
    case actions.UPDATE_USER: {
      const { result } = action as AuthSuccessAction;
      return {
        ...state,
        user: result,
      };
    }
    default:
      return state;
  }
}
