import { parseQueryString, getQueryStringFromUrl } from '@adrise/utils/lib/queryString';
import type * as Braze from '@braze/web-sdk';
import Analytics from '@tubitv/analytics';
import { ActionStatus, Manipulation, Messages, UserType } from '@tubitv/analytics/lib/authEvent';
import type { AnalyticsConfigProps, AuthType } from '@tubitv/analytics/lib/baseTypes';
import { DialogType, DialogAction } from '@tubitv/analytics/lib/dialog';
import type { Location } from 'history';
import { defineMessages } from 'react-intl';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import type { ValueOf } from 'ts-essentials';

import { exposeToTubiGlobal } from 'client/global';
import systemApi from 'client/systemApi';
import type VizioSystemApi from 'client/systemApi/vizio';
import { removeCookie, removeLocalData, setCookie } from 'client/utils/localDataStorage';
import { trackDialogEvent } from 'client/utils/track';
import { loadHomeScreen } from 'common/actions/container';
import { loadHistory, unloadHistory } from 'common/actions/history';
import { closeLeftNav } from 'common/actions/leftNav';
import { showSignInWithVizioModal } from 'common/actions/modal';
import { KidsModeEligibilityModalTypes, showKidsModeEligibilityModal } from 'common/actions/ottUI';
import { loadQueue, unloadQueue } from 'common/actions/queue';
import { showEligibilityModal, toggleAgeGateModal, addNotification, setKidsMode } from 'common/actions/ui';
import { setUserCoppaState, loadUserSettings } from 'common/actions/userSettings';
import * as actions from 'common/constants/action-types';
import {
  LD_DEFAULT_VIDEO_PREVIEW,
  LD_DEFAULT_AUTOSTART_VIDEO_PREVIEW,
  LD_DEFAULT_PROMPT_AUTOSTART_VIDEO_PREVIEW,
  LD_DEFAULT_AUTOPLAY_VIDEO_PREVIEW,
  HOME_DATA_SCOPE,
  COOKIE_CONTAINERS_CACHE_KEY,
  CONTENT_MODES,
  IS_SUPPORT_REDIRECTING,
} from 'common/constants/constants';
import { AGE_GATE_COOKIE } from 'common/constants/cookies';
import { EMAIL_CONFIRMATION_RESEND, LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import * as eventTypes from 'common/constants/event-types';
import type { UapiPlatformType } from 'common/constants/platforms';
import { OTT_ROUTES, WEB_ROUTES } from 'common/constants/routes';
import OTTVizioRegistrationSignInWithVizio from 'common/experiments/config/ottVizioRegistrationSignInWithVizio';
import {
  loginWithEmail,
  loginWithGoogleOneTap,
  registerWithEmail,
  requestActivationCode,
  resendConfirmEmail,
  changePassword as changePasswordApi,
  activateDevice as activateDeviceApi,
  checkActivationCodeStatus,
  fetchEmailAvailable,
  logoutAccount,
  addDelayedRegistrationParamIfEnabled,
} from 'common/features/authentication/api/auth';
import {
  ACTIVATION_CODE_QUERY_PARAM,
  ACTIVATION_FLOW_QUERY_PARAM,
  COPPA_ERROR_STATUS,
  COPPA_ERROR_STATUS_CODES,
  GOOGLE_LOGIN_METHOD,
} from 'common/features/authentication/constants/auth';
import { isLoggedInSelector, loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import persistedQueryParamsSelector from 'common/features/authentication/selectors/persistedQueryParams';
import type {
  AuthError,
  AuthFailAction,
  AuthSuccessAction,
  AuthThunk,
  LoginSuccessResult,
  OttActivationCodeStatusResponse,
  MagicLinkStatusRegisteredResponse,
  RegistrationData,
  RequestActivationCodeResponse,
  RequestMagicLinkResponse,
  SetLoginCallbackAction,
  SetLoginRedirectAction,
  SetUserDeviceIdAction,
  SetUserIpAction,
  SimpleAuthAction,
  StoreParentalPasswordAction,
  User,
  UserCredentials,
  SetUserDeviceFirstSeenAction,
  OttClearActivationCodeTokenAction,
  SetLoginCanceledCallbackAction,
  StoreUserCredentials,
} from 'common/features/authentication/types/auth';
import {
  UserCoppaStates,
} from 'common/features/authentication/types/auth';
import type { UserOrPending } from 'common/features/authentication/utils/api';
import {
  getAuthRequestOptions,
  setLoginInvokedTimestamp,
  getLoginInvokedTimestamp,
  getAdvertiserIdClientHeadersOptions,
} from 'common/features/authentication/utils/auth';
import {
  isAuthServerError,
  redirectToAuthErrorPage,
} from 'common/features/authentication/utils/error';
import { redirectAfterLogout } from 'common/features/authentication/utils/persistedQueryParams';
import { sendSignOutEvent } from 'common/features/authentication/utils/signOutStatus';
import { isCoppaEnabledSelector } from 'common/features/coppa/selectors/coppa';
import { isGDPREnabledSelector } from 'common/features/gdpr/selectors/gdpr';
import type ApiClient from 'common/helpers/ApiClient';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import { previousContentModeSelector } from 'common/selectors/contentMode';
import { isMajorEventActiveSelector } from 'common/selectors/remoteConfig';
import type { UnloadQueueAction } from 'common/types/queue';
import type { ThunkActionCreatorResolvedValue, TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type { RouteCode } from 'common/types/route-codes';
import type { StoreState } from 'common/types/storeState';
import type { Notification } from 'common/types/ui';
import type { UserSettingsAction } from 'common/types/userSettings';
import { actionWrapper } from 'common/utils/action';
import { getSSOUnlinkAction, setLockedInKidsModeCookie, setRequireLogoutCookie } from 'common/utils/ageGate';
import type {
  AccountEventPayload } from 'common/utils/analytics';
import {
  buildRequestForInfoEventObject,
  trackAccountEvent,
} from 'common/utils/analytics';
import {
  GoogleAnalyticsEventAction,
  GoogleAnalyticsEventCat,
  GoogleAnalyticsEventLabel,
  sendGoogleAnalyticsEvent,
  sendGA4Event,
} from 'common/utils/ga';
import { alwaysResolve } from 'common/utils/promise';
import { isParentalRatingOlderKidsOrLess } from 'common/utils/ratings';
import redirect from 'common/utils/redirect';
import { trackEvent, trackLogging } from 'common/utils/track';
import { getIntl } from 'i18n/intl';
import { isVizioEmailPrefillEnabledSelector } from 'ott/features/authentication/selectors/emailPrefill';
import type { SignInWithAmazonLocationState } from 'ott/features/authentication/utils/amazon';
import type {
  TrackRegisterEventGenerator,
} from 'ott/features/authentication/utils/auth';
import { trackRegisterEventGenerator, getUniversalSignInPage } from 'ott/features/authentication/utils/auth';
import type { SignInWithGoogleOneTapLocationState } from 'ott/features/authentication/utils/googleOneTap/bridge';
import {
  getUserSessionFromLocalStorage,
  isRedisPermitted,
  transformUserSessionToUser,
} from 'ott/features/authentication/utils/userSession';

const messages = defineMessages({
  resendTitle: {
    description: 'notification toast message title',
    defaultMessage: 'Unable to resend confirmation email',
  },
  resendDesc: {
    description: 'notification toast message description',
    defaultMessage: 'Please try again in a few minutes and if the issue persists please contact support',
  },
  resendButton: {
    description: 'notification toast message button text',
    defaultMessage: 'Resend Email',
  },
  resendButtonTwo: {
    description: 'notification toast message button text',
    defaultMessage: 'Contact Support',
  },
  signInTitle: {
    description: 'notification toast message title',
    defaultMessage: 'Need to Sign In',
  },
  signInDesc: {
    description: 'notification toast message description',
    defaultMessage: 'You will need to be Signed In to be request new confirmation email.',
  },
  signInButton: {
    description: 'notification toast message button text',
    defaultMessage: 'Sign In',
  },
});

declare global {
  var braze: typeof Braze;
}

/**
 * sync local auth credentials with server
 * if this fails, we must log the user out client-side via LOAD_AUTH_SUCCESS
 * @note - runs in App.js fetchDataDeferred, every time we change url's
 */
export const load = (location: Location): AuthThunk<
  Promise<
    [
      ReturnType<typeof unloadHistory>,
      ReturnType<typeof unloadQueue>,
      ThunkActionCreatorResolvedValue<typeof loadHomeScreen>,
    ]
    | AuthFailAction
    | void
  >
> => async (dispatch, getState, client) => {
  dispatch(actionWrapper(actions.LOAD_AUTH));

  const state = getState();
  const loggedInOnClient = isLoggedInSelector(state);
  const userSession = await getUserSessionFromLocalStorage();

  if (userSession) {
    const result = transformUserSessionToUser(userSession);
    dispatch({ type: actions.LOAD_AUTH_SUCCESS, result });
    return Promise.resolve();
  }

  if (!isRedisPermitted()) {
    return Promise.resolve();
  }

  return client.get('/oz/auth/loadAuth')
    // can return undefined also, so better to just use unknown
    .then((user: User) => {
      // if user is null, it means the auth credentials are invalid. `null` should then be passed to load_auth_success action
      dispatch({ type: actions.LOAD_AUTH_SUCCESS, result: user });
      if (!user && loggedInOnClient) {
        // no user in server, log out existing user
        return Promise.all([
          dispatch(unloadHistory()),
          dispatch(unloadQueue()),
          dispatch(loadHomeScreen({ location, force: true })),
        ]);
      }
    })
    .catch((error: AuthError) => {
      return dispatch({ type: actions.LOAD_AUTH_FAIL, error } as AuthFailAction);
    });
};

export function loginSuccess(result: LoginSuccessResult): AuthSuccessAction {
  return {
    type: actions.LOGIN_SUCCESS,
    result,
  };
}

export function loginFail(error: AuthError): AuthFailAction {
  return {
    type: actions.LOGIN_FAIL,
    error,
  };
}

/**
 * Used to clear the login actions and therefore making sure no unwanted redirect and action upon subsequent user login
 */
export function clearLoginActions() {
  return {
    type: actions.CLEAR_LOGIN_ACTIONS,
  };
}

/**
 * An async action that logs the user in
 *
 * @param email email as entered by the user
 * @param password user password
 * @param authType optional AuthType value
 */
export function login(
  email: string,
  password: string,
  location: Location,
  authType?: AuthType,
): AuthThunk<Promise<boolean | UserSettingsAction>> {
  /* @param client: an instance of ApiClient, useful to pass in if testing in order to mock ajax on the browser */
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const { braze } = global;
    dispatch(actionWrapper(actions.LOGIN));
    let loginResult: User;
    let hasAge = true;
    const state = getState();
    const isCoppaEnabled = isCoppaEnabledSelector(state);
    const isGDPREnabled = isGDPREnabledSelector(state);

    const options = {
      data: {
        username: email,
        password,
        authType,
      } as {
        username: string,
        password: string,
        authType?: AuthType,
      },
    };

    if (__WEBPLATFORM__ === 'WEB' && !isGDPREnabled) {
      const timestamp = getLoginInvokedTimestamp();
      if (timestamp) {
        logger.warn({ email, timeDiff: Date.now() - timestamp }, 'Login already invoked');
      }
      setLoginInvokedTimestamp();
    }

    return dispatch(loginWithEmail(options.data)).then((result) => {
      loginResult = result;
      hasAge = result.hasAge ?? false;

      /* istanbul ignore else */
      if (isCoppaEnabled) {
        if (hasAge) {
          setUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
        } else {
          /**
           * edge case where use can login with google, leave age gate page, request a new password
           * and then login with email with no age. but most often, email users will always have age
           */
          setUserCoppaState(dispatch, UserCoppaStates.REQUIRE_AGE_GATE);
        }
      }

      if (!result.hasAge) {
        hasAge = false;
      }

      // set the user data for analytics
      Analytics.mergeConfig((): AnalyticsConfigProps => ({
        user_id: `${result.userId}`,
        auth_type: result.authType,
      }));

      // see actions/userSettings.js updateUserSettings comment
      // track account event
      /* istanbul ignore else */
      if (!isCoppaEnabled || (isCoppaEnabled && hasAge)) {
        trackAccountEvent({
          manip: Manipulation.SIGNIN,
          current: 'EMAIL',
          message: Messages.SUCCESS,
          status: ActionStatus.SUCCESS,
        } as AccountEventPayload);
      }

      if (braze) {
        braze.changeUser(String(result.userId));
      }

      // @note - make sure to load user settings before requesting containers
      // dispatching loginSuccess before usersettings is loaded triggers a re-render without the user-specific settings, not good
      // include new token to send with the request
      return dispatch(loadUserSettings(false, loginResult.token));
    }).then(() => {
      // after logged in, load/update necessary container
      return dispatch(reloadForUser(location, loginResult)).then(() => {
        return Promise.resolve(hasAge);
      });
    }).catch((err) => {
      dispatch(loginFail(err));
      return Promise.reject(err);
    });
  };
}

export function loginWithGoogle({
  method = GOOGLE_LOGIN_METHOD.SIGNIN_WITH_GOOGLE,
  ...payload
}: {
  idToken?: string,
  code?: string,
  method?: GOOGLE_LOGIN_METHOD,
}): AuthThunk<Promise<void>> {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState, client: ApiClient) => {
    const state = getState();
    const { auth } = state;
    const { loginRedirect, loginCallback } = auth;
    const { search } = tubiHistory.getCurrentLocation();
    const isOneTap = method === GOOGLE_LOGIN_METHOD.GOOGLE_ONE_TAP;
    let redirect: unknown | string;
    const isCoppaEnabled = isCoppaEnabledSelector(getState());

    dispatch(clearLoginActions());
    dispatch(actionWrapper(actions.LOGIN));
    const options = {
      data: {
        ...payload,
        type: method,
      },
    };

    /**
     * When user signs in via OneTap, idToken is passed. We'll send the request to account service directly.
     * When user signs in via Google Button (OAuth2 flow), code is passed. We'll send request to /oz/auth/google to exchange code with access_token.
     */
    let request;
    if (isOneTap && payload.idToken) {
      request = dispatch(loginWithGoogleOneTap({ idToken: payload.idToken }));
    } else {
      addDelayedRegistrationParamIfEnabled(options);
      request = client.post(
        '/oz/auth/google',
        getAuthRequestOptions({ state, options, useAnonymousToken: true }),
      );
    }
    return request.then((result) => {
      // rare case where user can log in with SSO (and not have age), then reset a new password and
      // log in with an email account that has no age
      const { status, hasAge } = result;
      const isNewUser = status === 'new';
      const redirectAfterLogin = parseQueryString(search).redirect || loginRedirect;
      redirect = redirectAfterLogin;

      if (isCoppaEnabled) {
        if (!hasAge) {
          const base = WEB_ROUTES.register;
          redirect = redirectAfterLogin ? `${base}?redirect=${encodeURIComponent(redirectAfterLogin as string)}` : base;
        }
      }

      Analytics.mergeConfig((): AnalyticsConfigProps => ({
        user_id: `${result.userId}`,
        auth_type: result.authType,
      }));

      // see actions/userSettings.js updateUserSettings comment
      /* istanbul ignore else */
      if (!isCoppaEnabled || (isCoppaEnabled && hasAge)) {
        trackAccountEvent({
          manip: isNewUser ? Manipulation.SIGNUP : Manipulation.SIGNIN,
          current: 'GOOGLE',
          message: Messages.SUCCESS,
          status: ActionStatus.SUCCESS,
        } as AccountEventPayload);
      }

      trackDialogEvent(DialogType.REGISTRATION, isOneTap ? 'google_one_tap' : 'google_sign_in', DialogAction.ACCEPT_DELIBERATE);

      /* istanbul ignore else */
      if (isNewUser) {
        const registerMethod = ({
          [GOOGLE_LOGIN_METHOD.SIGNIN_WITH_GOOGLE]: GoogleAnalyticsEventLabel.GOOGLE,
          [GOOGLE_LOGIN_METHOD.GOOGLE_ONE_TAP]: GoogleAnalyticsEventLabel.GOOGLE_ONE_TAP,
        })[method];
        sendGoogleAnalyticsEvent({
          eventCategory: GoogleAnalyticsEventCat.WEB,
          eventAction: GoogleAnalyticsEventAction.REGISTER,
          eventLabel: registerMethod,
        });
        // https://developers.google.com/tag-platform/gtagjs/reference/events#sign_up
        sendGA4Event('sign_up', {
          method: registerMethod,
        });
      }

      if (loginCallback) loginCallback();

      /* istanbul ignore else */
      if (window) {
        // coppa refactor. we use hard redirect and this leads to doing a birthday check on server/render.js L239
        window.location.href = redirect as string || WEB_ROUTES.home;
      }
    }).catch((err) => {
      trackAccountEvent({
        manip: Manipulation.SIGNIN,
        current: 'GOOGLE',
        message: Messages.ERROR,
        status: ActionStatus.FAIL,
      } as AccountEventPayload);
      trackLogging({
        type: TRACK_LOGGING.clientInfo,
        subtype: LOG_SUB_TYPE.REGISTRATION.GOOGLE_SIGN_IN_ERROR,
        message: `loginWithGoogle - ${err?.stack || err?.message}`,
      });
      dispatch(loginFail(err));
      return Promise.reject(err);
    });
  };
}

/**
 * Convenience method to allow the server to fire an action that loads the user details. This is done on the
 * initial render if we determine the user already has a session
 *
 * @param user an object with all the user details, as serialized in server/auth
 */
export function logUserIn(user: User): AuthSuccessAction {
  return {
    type: actions.LOGIN_SUCCESS,
    result: user,
  };
}

interface RegisterErrorHandlerParams {
  error: AuthError;
  trackRegisterEvent?: ReturnType<TrackRegisterEventGenerator>;
  handleNonCoppaError?: VoidFunction;
  shouldSkipServerErrorRedirect?: boolean;
}

export const registerErrorHandler = ({
  error,
  trackRegisterEvent,
  handleNonCoppaError,
  shouldSkipServerErrorRedirect = false,
}: RegisterErrorHandlerParams) => {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const state = getState();
    const location = tubiHistory.getCurrentLocation();
    onActivateDeviceFlowFail(error, loginRedirectSelector(state, { queryString: location.search }));

    const { status } = error;

    if (COPPA_ERROR_STATUS_CODES.includes(status)) {
      trackRegisterEvent?.({
        message: Messages.COPPA_FAIL,
        status: ActionStatus.FAIL,
      });

      if (status === COPPA_ERROR_STATUS.BELOW_MIN_AGE) {
        // user is not compliant, lock them in kids mode for 24 hours
        setUserCoppaState(dispatch, UserCoppaStates.NOT_COMPLIANT);
        setLockedInKidsModeCookie();
        dispatch(showKidsModeEligibilityModal(KidsModeEligibilityModalTypes.DEFAULT));
        dispatch(setKidsMode(true));
      }

      if (status === COPPA_ERROR_STATUS.LEGAL) {
        setUserCoppaState(dispatch, UserCoppaStates.REQUIRE_LOGOUT);
        if (isGDPREnabledSelector(state)) {
          setRequireLogoutCookie();
          if (__ISOTT__) {
            tubiHistory.replace(OTT_ROUTES.ageUnavailable);
          } else {
            redirect(WEB_ROUTES.ageUnavailable);
          }
          throw error;
        }
      }

      dispatch(actionWrapper(actions.RESET_AUTH));

      /* istanbul ignore next */
      dispatch(loadHomeScreen({ location, force: true }))
        .then(() => tubiHistory.replace(__ISOTT__ ? OTT_ROUTES.home : WEB_ROUTES.home))
        .then(() => dispatch(showEligibilityModal()));
    } else {
      trackRegisterEvent?.({
        message: Messages.ERROR,
        status: ActionStatus.FAIL,
      });
      handleNonCoppaError?.();
    }

    // Redirect to error page for server errors (status >= 500)
    if (!shouldSkipServerErrorRedirect && isAuthServerError(error, isMajorEventActiveSelector(state))) {
      redirectToAuthErrorPage(error, { type: 'signUp' });
    }

    throw error;
  };
};

/**
 * Ask the backend to create a new user and then log the user in
 *
 * Need to create valid bday by combing 3 sep fields in UI
 * @param data see SignUpForm container for the fields send here
 */
export function register(location: Location, data: Partial<RegistrationData>) {
  const { firstName, password, email, emailType, gender, birthMonth, birthDay, birthYear, registrationUID, personalizedEmails } = data;
  /* istanbul ignore next */
  // prepend zeros if needed
  const bmonth = birthMonth?.length === 1 ? `0${birthMonth}` : birthMonth;
  const bday = birthDay?.length === 1 ? `0${birthDay}` : birthDay;
  const dateOfBirth = `${bmonth}/${bday}/${birthYear}`;
  const trackRegisterEvent = trackRegisterEventGenerator('EMAIL');
  const { braze } = global;

  return async (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const state = getState();
    const isCoppaEnabled = isCoppaEnabledSelector(state);
    // Track RequestForInfoEvent for birthday and gender info
    if (isCoppaEnabled && birthYear && bmonth && bday) {
      const birthday = `${birthYear}-${bmonth}-${bday}`;
      if (__ISOTT__) {
        trackEvent(eventTypes.REQUEST_FOR_INFO_EVENT, buildRequestForInfoEventObject({ birthday }));
      } else if (gender) {
        // On web only track birthday and gender event if gender is present
        trackEvent(eventTypes.REQUEST_FOR_INFO_EVENT, buildRequestForInfoEventObject({ birthday }));
        trackEvent(eventTypes.REQUEST_FOR_INFO_EVENT, buildRequestForInfoEventObject({ gender }));
      }
    }

    dispatch(actionWrapper(actions.EMAIL_REGISTRATION));

    const registrationData = {
      firstName,
      password,
      email,
      emailType,
      gender,
      birthday: dateOfBirth,
      registrationUID,
      personalizedEmails,
    };

    try {
      const user = await dispatch(registerWithEmail(registrationData));
      const userIdString = `${user.userId}`;

      /* istanbul ignore else */
      if (isCoppaEnabled) {
        setUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
      }

      // Set user data in analytics after user registration
      Analytics.mergeConfig((): AnalyticsConfigProps => ({
        user_id: userIdString,
        auth_type: 'EMAIL' as AuthType,
      }));

      // Track account event after successful registration
      trackRegisterEvent({
        message: Messages.SUCCESS,
        status: ActionStatus.SUCCESS,
      });

      if (braze) {
        braze.changeUser(userIdString);
      }

      /* istanbul ignore else */
      sendGoogleAnalyticsEvent({
        eventCategory: GoogleAnalyticsEventCat.WEB,
        eventAction: GoogleAnalyticsEventAction.REGISTER,
        eventLabel: GoogleAnalyticsEventLabel.EMAIL,
      });

      sendGA4Event('sign_up', {
        method: GoogleAnalyticsEventLabel.EMAIL,
      });

      dispatch(actionWrapper(actions.EMAIL_REGISTRATION_SUCCESS, { result: user }));
      dispatch(loadHomeScreen({
        force: true,
        scope: HOME_DATA_SCOPE.firstScreen,
        location,
      }));

      return user;
    } catch (error) {
      return dispatch(registerErrorHandler({
        error,
        trackRegisterEvent,
        handleNonCoppaError: /* istanbul ignore next */ () =>
          dispatch(actionWrapper(actions.EMAIL_REGISTRATION_FAIL, { error })),
      }));
    }
  };
}

/**
 * reset user password
 */
export function changePassword(currentPassword: string, password: string): AuthThunk<Promise<void>> {
  const baseEventProps = {
    manip: Manipulation.CHANGEPW,
    userType: UserType.EXISTING_USER,
  };
  return (dispatch: TubiThunkDispatch) => {
    return dispatch(changePasswordApi({ currentPassword, password })).then(() => {
      trackAccountEvent({
        ...baseEventProps,
        message: Messages.SUCCESS,
        status: ActionStatus.SUCCESS,
      });
      dispatch(actionWrapper(actions.CHANGE_PASSWORD_SUCCESS));
      return Promise.resolve();
    }).catch((error) => {
      trackAccountEvent({
        ...baseEventProps,
        message: Messages.ERROR,
        status: ActionStatus.FAIL,
      });
      return Promise.reject(error);
    });
  };
}

/**
 * Ask the server to activate a specific device. The server will assume that the user is the current user and they
 * should be logged in
 *
 * @param code the activation code as entered by the user
 */
export function activateDevice(code: string): AuthThunk<Promise<void>> {
  const baseEventProps = {
    manip: Manipulation.REGISTER_DEVICE,
    userType: UserType.UNKNOWN_USER_TYPE,
  };
  return (dispatch: TubiThunkDispatch) => {
    dispatch(actionWrapper(actions.ACTIVATION_CODE));
    return dispatch(activateDeviceApi(code))
      .then(() => {
        trackAccountEvent({
          ...baseEventProps,
          status: ActionStatus.SUCCESS,
        });
        return Promise.resolve();
      })
      .catch((error) => {
        const isInvalidCode = error.status === 400;
        trackAccountEvent({
          ...baseEventProps,
          status: ActionStatus.FAIL,
          message: isInvalidCode ? Messages.INVALID_CODE_ERROR : Messages.ERROR,
        });
        return Promise.reject(error);
      });
  };
}

export function setUserRealIP(ipAddress: string): SetUserIpAction {
  return {
    type: actions.SET_USER_IP,
    ipAddress,
  };
}

/**
 * Make the device id part of the state so clients can grab it without funny cookie parsing
 */
export function setDeviceId(deviceId?: string): SetUserDeviceIdAction {
  return {
    type: actions.SET_USER_DEVICE_ID,
    deviceId,
  };
}

/**
 * Make first_seen part of the state so clients can grab it without funny cookie parsing
 */
export function setFirstSeen(firstSeen?: string): SetUserDeviceFirstSeenAction {
  return {
    type: actions.SET_USER_DEVICE_FIRST_SEEN,
    firstSeen,
  };
}

/**
 * Used to clear the login error when submitting the for again with new content
 */
export function clearLoginError(): SimpleAuthAction {
  return {
    type: actions.CLEAR_LOGIN_ERROR,
  };
}

export interface OTTRequestActivationCodeOptions {
  generateQRCode?: boolean;
}

export function ottClearActivationCode(): OttClearActivationCodeTokenAction {
  return {
    type: actions.OTT_CLEAR_ACTIVATION_CODE_TOKEN,
  };
}

/**
 * An async action that gets activation code for ott devices
 *
 * @param deviceId potentially from state.auth.deviceId
 * @param platform i.e. amazon
 * @param generateQrcode
 */
export function ottRequestActivationCode(
  deviceId: string,
  platform: UapiPlatformType,
  generateQrcode: boolean,
): AuthThunk<Promise<void>> {
  return (dispatch: TubiThunkDispatch) => {
    dispatch(actionWrapper(actions.OTT_REQUEST_ACTIVATION_CODE_PENDING, { status: true }));
    return dispatch(requestActivationCode(generateQrcode))
      .then((result: RequestActivationCodeResponse) => {
        const { activation_code, activation_token, qr_code_data_url } = result;
        dispatch(actionWrapper(actions.OTT_REQUEST_ACTIVATION_CODE_PENDING, { status: false }));
        dispatch(actionWrapper(
          actions.OTT_SET_ACTIVATION_CODE_TOKEN,
          {
            ottActivationCode: activation_code,
            ottActivationToken: activation_token,
            ottActivationQRCodeDataURL: qr_code_data_url,
            ottActivationTimestamp: +new Date(),
          }),
        );
      }).catch((error: AuthError) => {
        dispatch(actionWrapper(actions.OTT_REQUEST_ACTIVATION_CODE_PENDING, { status: false, error }));
        logger.error(error, 'Error requesting OTT activation code in ottRequestActivationCode');
        return Promise.reject(error);
      });
  };
}

type OttHandleActivateSuccess = (location: Location, result: User | OttActivationCodeStatusResponse) => AuthThunk<
Promise<
  ThunkActionCreatorResolvedValue<typeof reloadForUser>
>
>;
export const ottHandleActivateSuccess: OttHandleActivateSuccess = (location, result) => async (dispatch, getState) => {
  if (result.userId) {
    const isCoppaEnabled = isCoppaEnabledSelector(getState());
    if (isCoppaEnabled) {
      if (result.hasAge) {
        setUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
      } else {
        // If user age is not set, we make sure to age-gate user.
        setUserCoppaState(dispatch, UserCoppaStates.REQUIRE_AGE_GATE);
      }
    }
    // Load user settings for parental rating which can affect whether or
    // not we are in kids mode
    // Include new token to send with the request
    await dispatch(loadUserSettings(false, result.token));
  }

  return dispatch(reloadForUser(location, result));
};

/**
 * An async action to check the status of the activation token used for online register
 *
 * @param activationToken which was received by ottRequestActivationCode
 * @param deviceId potentially from state.auth.deviceId
 * @param platform i.e. amazon
 */
export const ottCheckActivationCodeStatus = (
  activationToken: string,
  deviceId: string,
  platform: string,
  location: Location,
): AuthThunk<Promise<ThunkActionCreatorResolvedValue<typeof ottHandleActivateSuccess> | void>> => async (dispatch) => {
  const result: UserOrPending = await dispatch(checkActivationCodeStatus(activationToken));
  const { status } = result;
  if (status === 'registered') {
    Analytics.mergeConfig((): AnalyticsConfigProps => ({
      user_id: `${result.userId}`,
      auth_type: 'CODE' as AuthType,
    }));
    trackAccountEvent({
      manip: Manipulation.REGISTER_DEVICE,
      status: ActionStatus.SUCCESS,
    });
    return dispatch(ottHandleActivateSuccess(location, result));
  }
};

/**
 * A thunk action that will disable kids mode unless the parentalRating is Older Kids or below.
 */
export function clearKidsModeIfParentalRatingAllows(): AuthThunk<void> {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const state = getState();
    const { userSettings: { parentalRating } } = state;
    /*
    You can set kids mode on when you are not logged in.
    When you log in after kids mode is ON using the Sign In option in left nav,
    (say the user is in adult mode) then the homescreen content shows kids content
    but the UI is adults UI which is not correct, we need to not maintain kids mode
    between sessions and adhere to parental ratings. The following change does this.
    */
    dispatch(setKidsMode(isParentalRatingOlderKidsOrLess(parentalRating)));
  };
}

export function mockSuitestLogin(location: Location) {
  const registrationData = {
    firstName: 'suitest',
    password: '111111',
    email: `build+suitest-${__OTTPLATFORM__}-${Date.now()}@tubi.tv`,
    gender: 'male',
    birthday: '02/19/1993',
  };
  return ((dispatch: TubiThunkDispatch) => dispatch(
    registerWithEmail(registrationData),
  ).then((result: User) => {
    dispatch(clearKidsModeIfParentalRatingAllows());

    return dispatch(reloadForUser(location, result));
  })) as any;
}

/**
 * Callback function to be executed after login. e.g. add video to queue
 */
export function loginCallback(callback: () => void): SetLoginCallbackAction {
  return {
    type: actions.SET_LOGIN_CALLBACK,
    callback,
  };
}

/**
 * Used to declare a redirect url upon login instead of default '/'.
 * e.g. addToQueue would want to return to video detail page
 */
export function loginRedirect<T>(redirectUrl: T): SetLoginRedirectAction<T> {
  return {
    type: actions.SET_LOGIN_REDIRECT,
    redirectUrl,
  };
}

/**
 * Callback function to be executed when login is canceled by user.
 * Usually we don't need this, as when user cancel login, we'll call `goBack`.
 * This is needed when we have different routing flows.
 */
export function onLoginCanceled(callback: () => void): TubiThunkAction<ThunkAction<SetLoginCanceledCallbackAction, unknown, unknown, AnyAction>> {
  return (dispatch: TubiThunkDispatch) => {
    // after callback is being triggered, clean it automatically
    const wrappedCallback = () => {
      callback();
      dispatch(clearLoginActions());
    };
    return dispatch(actionWrapper(actions.SET_LOGIN_CANCELED_CALLBACK, { callback: wrappedCallback }));
  };
}

/**
 * An async action that logs the user out
 */
interface LogoutOptions {
  isByUser?: boolean;
  redirectPathAfterLogout?: string;
  logoutOnProxyServerOnly?: boolean;
}
export const logout = (location: Location, { isByUser = false, redirectPathAfterLogout, logoutOnProxyServerOnly = false }: LogoutOptions = {}): AuthThunk<
  Promise<
    [
      void,
      UnloadQueueAction,
      ThunkActionCreatorResolvedValue<typeof loadHistory>,
      ThunkActionCreatorResolvedValue<typeof loadHomeScreen>,
    ]
    | void // if there's an error
  >
> => async (dispatch, getState) => {
  const { auth: { user } } = getState();
  const { authType } = user as User || {};
  const isWebCoppaEnabled = !__ISOTT__ && isCoppaEnabledSelector(getState());
  dispatch(actionWrapper(actions.LOGOUT));
  let hasError = false;
  try {
    // sequentially request the account API, then the proxy API
    // ensure that we clear user session after successfully invalidate user's token
    await dispatch(logoutAccount({ isByUser, logoutOnProxyServerOnly }));
    const { userSettings: { coppaState } } = getState();

    if (__ISOTT__) {
      // When logging out set kids mode to false
      dispatch(setKidsMode(false));
    }

    let unlinkAction: Promise<void> | undefined;
    if (isWebCoppaEnabled && coppaState === UserCoppaStates.NOT_COMPLIANT) {
      unlinkAction = getSSOUnlinkAction(authType);
      setLockedInKidsModeCookie();
      dispatch(toggleAgeGateModal({ isVisible: false }));
      dispatch(setKidsMode(true));
    }

    if (isByUser) {
      // set the cookie on client as the cookie set by server is not working for Samsung
      if (__OTTPLATFORM__ === 'TIZEN') {
        removeCookie(AGE_GATE_COOKIE);
      }
      // trigger the sign out events, when the platform doesn't support URL redirect to sign out.
      if (!IS_SUPPORT_REDIRECTING) {
        sendSignOutEvent(true);
      }
    }

    removeLocalData(LD_DEFAULT_VIDEO_PREVIEW);
    removeLocalData(LD_DEFAULT_AUTOSTART_VIDEO_PREVIEW);
    removeLocalData(LD_DEFAULT_AUTOPLAY_VIDEO_PREVIEW);
    removeLocalData(LD_DEFAULT_PROMPT_AUTOSTART_VIDEO_PREVIEW);

    // clear the user data for analytics
    Analytics.mergeConfig((): AnalyticsConfigProps => ({
      user_id: undefined,
      auth_type: 'NOT_AUTHED' as AuthType,
    }));

    dispatch(actionWrapper(actions.LOGOUT_SUCCESS));
    dispatch(unloadHistory());
    return await (redirectPathAfterLogout ? Promise.resolve() : Promise.all([
      unlinkAction ? alwaysResolve(unlinkAction) : Promise.resolve(),
      dispatch(unloadQueue()),
      dispatch(loadHistory(true)),
      dispatch(loadHomeScreen({ location, force: true })),
    ]));
  } catch (err) {
    if (!IS_SUPPORT_REDIRECTING && isByUser) {
      sendSignOutEvent(false);
    }
    hasError = true;
    dispatch(actionWrapper(actions.LOGOUT_FAIL, { error: err }));
  } finally {
    const persistedQueryParams = persistedQueryParamsSelector(getState());
    if (redirectPathAfterLogout) {
      redirectAfterLogout({
        isByUser,
        persistedQueryParams,
        hasError,
        path: redirectPathAfterLogout,
      });
    }
  }
};

// Allow programmatic logging out in non-prod environments by doing:
// Tubi.ExperimentManager.store.dispatch(Tubi.logoutAction());
if (__CLIENT__) {
  exposeToTubiGlobal({
    logoutAction: logout,
  });
}

export function resendEmailConfirmation(): AuthThunk<Promise<void>> {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => dispatch(resendConfirmEmail())
    .catch((err) => {
      logger.error({ err }, EMAIL_CONFIRMATION_RESEND);

      const intl = getIntl(getState().ui.userLanguageLocale);
      const notification: Notification = {
        status: 'warning',
        title: intl.formatMessage(messages.resendTitle),
        description: intl.formatMessage(messages.resendDesc),
        autoDismiss: false,
        buttons: [
          {
            title: intl.formatMessage(messages.resendButton),
            primary: true,
            action: () => {
              dispatch(resendEmailConfirmation());
            },
          },
          {
            title: intl.formatMessage(messages.resendButtonTwo),
            action: () => {
              tubiHistory.push(WEB_ROUTES.support);
            },
          },
        ],
      };
      // unable to resend email confirmation since they are not Signed In
      if (err.code === 403) {
        notification.title = intl.formatMessage(messages.signInTitle);
        notification.description = intl.formatMessage(messages.signInDesc);
        notification.buttons = [
          {
            title: intl.formatMessage(messages.signInButton),
            action: () => {
              dispatch(loginCallback(resendEmailConfirmation));
              tubiHistory.push(WEB_ROUTES.signIn);
            },
          },
        ];
      }
      dispatch(addNotification(notification, 'sign-in'));
    });
}

/**
 * when users try to change parental settings, they will go to password form page,
 * after submitting, we store the password and prepare for updating parental settings.
 */
export function storePassword(password: string): StoreParentalPasswordAction {
  return {
    type: actions.STORE_PARENTAL_PASSWORD,
    password,
  };
}

export function clearPassword(): SimpleAuthAction {
  return {
    type: actions.CLEAR_PARENTAL_PASSWORD,
  };
}

export function resetPassword(email: string): AuthThunk<Promise<void>> {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState, client: ApiClient) => {
    return client.post('/oz/auth/forgot', {
      data: {
        email,
      },
    });
  };
}

export const reloadForUser = (location: Location, user: LoginSuccessResult): TubiThunkAction<
  ThunkAction<
    Promise<[
      ReturnType<typeof loginSuccess>,
      ThunkActionCreatorResolvedValue<typeof loadHomeScreen>,
    ]>,
    StoreState,
    ApiClient,
    AnyAction
  >
> => async (dispatch, getState) => {
  const prevContentMode = previousContentModeSelector(getState());
  const promiseResult = await Promise.all([
    dispatch(loginSuccess(user)),
    dispatch(loadHomeScreen({
      // If the user is coming from the myStuff page, we need to load data for
      // the myStuff content mode, not the "all" content mode.
      location: prevContentMode === CONTENT_MODES.myStuff
        ? { ...location, pathname: __ISOTT__ ? OTT_ROUTES.myStuff : WEB_ROUTES.myStuff }
        : location,
      force: true,
      scope: HOME_DATA_SCOPE.firstScreen,
    })),
  ]);
  dispatch(loadHistory(true));
  dispatch(loadQueue(location, true));
  return promiseResult;
};

export function handleSuccessfulLogin(): AuthThunk<Promise<void> | void> {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const { auth: { user, loginCallback } } = getState();
    if (user) {
      // set cacheKey so that the homescreen tensor request will not be cached by the browser
      setCookie(COOKIE_CONTAINERS_CACHE_KEY, `${Date.now()}`, 300);

      if (loginCallback) {
        const callbackResult = loginCallback();
        if (callbackResult?.cancelGoBack) {
          return Promise.resolve();
        }
      }

      const { auth: { loginRedirect } } = getState();
      if (loginRedirect) {
        return tubiHistory.replace(loginRedirect);
      }
      tubiHistory.goBack();
    }
  };
}

export function clearLogin(): AuthThunk<SimpleAuthAction | void> {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const { auth: { loginCallback, loginRedirect } } = getState();
    if (loginRedirect || loginCallback) {
      dispatch(clearLoginActions());
    }
  };
}

export function removeUserCredentials(): SimpleAuthAction {
  return {
    type: actions.REMOVE_USER_CREDENTIALS,
  };
}
export function storeUserCredentials(userCredentials: UserCredentials): StoreUserCredentials {
  return {
    type: actions.STORE_USER_CREDENTIALS,
    userCredentials,
  };
}

export function storeCredentialsAndSetCoppaState(userCredentials: UserCredentials): AuthThunk<void> {
  return (dispatch: TubiThunkDispatch) => {
    setUserCoppaState(dispatch, UserCoppaStates.REQUIRE_AGE_GATE);
    dispatch(storeUserCredentials(userCredentials));
  };
}

/*
 * Util function for activation device flow:
 * Activation for guest (See ActivationFirst):
 *   1. input activate code -> 2. register/login -> 3. redirect to /activate?code=[code]&referer=activate_first
 * If step 2 fails (like because of coppa), user wouldn't be able continue the activation.
 *
 * This function tracks the RegisterDevice account event,
 * so that we could analyse how many activation fails due to specific errors.
 */
export function onActivateDeviceFlowFail(error: AuthError, loginRedirect: string) {
  const redirectParams = parseQueryString(getQueryStringFromUrl(loginRedirect));
  if (redirectParams[ACTIVATION_FLOW_QUERY_PARAM] && redirectParams[ACTIVATION_CODE_QUERY_PARAM]) {
    if (COPPA_ERROR_STATUS_CODES.includes(error.status)) {
      trackAccountEvent({
        manip: Manipulation.REGISTER_DEVICE,
        userType: UserType.UNKNOWN_USER_TYPE,
        status: ActionStatus.FAIL,
        message: Messages.COPPA_FAIL,
      });
    }
  }
}

export function checkEmail(email: string): AuthThunk<Promise<RouteCode>> {
  // API response:
  // https://docs.tubi.io/api_docs/account.v1#operations-User-get-user-email_available
  return (dispatch: TubiThunkDispatch): Promise<RouteCode> => {
    return dispatch(
      fetchEmailAvailable(email),
    ).then(({ code }: { code: RouteCode }) => {
      return Promise.resolve(code);
    }).catch((error: Error & { code?: RouteCode, taken?: boolean }) => {
      // if email is deleted, API would return 400 with response: { code: 'BLANK', taken: false }
      if (error.code === 'BLANK' && error.taken === false) {
        return Promise.resolve<RouteCode>('BLANK');
      }
      return Promise.reject(error);
    });
  };
}

type LocationState = SignInWithAmazonLocationState | SignInWithGoogleOneTapLocationState;

interface GoToSignInPageOption {
  useReplace?: boolean;
  locationState?: LocationState;
}

export function goToSignInPage({ useReplace, locationState }: GoToSignInPageOption = {}): AuthThunk<void> {
  return async (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    const state = getState();
    const loc = getUniversalSignInPage(state, locationState);
    let shouldShowSignInWithVizioModal = false;
    if (isVizioEmailPrefillEnabledSelector(state)) {
      const vizioSystemApi = systemApi as VizioSystemApi;
      /* istanbul ignore else */
      if (vizioSystemApi.isAccountFeatureSupported() && await vizioSystemApi.isTvLinked()) {
        const ottVizioRegistrationSignInWithVizio = OTTVizioRegistrationSignInWithVizio();
        ottVizioRegistrationSignInWithVizio.logExposure();
        /* istanbul ignore else */
        if (ottVizioRegistrationSignInWithVizio.getValue() === 'email_prefill') {
          shouldShowSignInWithVizioModal = true;
        }
      }
    }
    if (shouldShowSignInWithVizioModal) {
      dispatch(showSignInWithVizioModal({ useReplace }));
    } else if (useReplace) {
      tubiHistory.replace(loc);
    } else {
      tubiHistory.push(loc);
    }
  };
}

interface RequestMagicLinkOption {
  email: string;
  deviceId: string;
  platform: UapiPlatformType;
  forRegistration: boolean;
}

export function requestMagicLink({
  email,
  deviceId,
  platform,
  forRegistration,
}: RequestMagicLinkOption): AuthThunk<Promise<RequestMagicLinkResponse['uid']>> {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState, client: ApiClient) => {
    const options = {
      data: {
        device_id: deviceId,
        platform,
        email,
      },
      retryCount: 1,
    };
    const endpoint = forRegistration ? 'registration-link' : 'magic-link';
    return client.post(
      `/oz/auth/${endpoint}/`,
      getAuthRequestOptions({ state: getState(), options, useAnonymousToken: true }),
    ).then((result: RequestMagicLinkResponse) => {
      const { uid } = result;
      return uid;
    }).catch((error: AuthError) => {
      logger.error(error, `Error sending OTT ${endpoint}`);
      return Promise.reject(error);
    });
  };
}

interface CheckMagicLinkStatusOption {
  uid: string;
  forRegistration: boolean;
}
export function checkMagicLinkStatus({ forRegistration, uid }: CheckMagicLinkStatusOption): AuthThunk<Promise<MagicLinkStatusRegisteredResponse>> {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState, client: ApiClient) => {
    const endpoint = forRegistration ? 'registration-link-status' : 'magic-link-status';
    return client.post(`/oz/auth/${endpoint}/`, {
      data: {
        uid,
      },
      ...getAdvertiserIdClientHeadersOptions(),
    });
  };
}

export const setOttOneTapPendingStatus = (status: boolean) => ({
  type: actions.OTT_ONE_TAP_PENDING,
  status,
});

const RESTRICTED_ROUTES: ValueOf<typeof OTT_ROUTES>[] = [OTT_ROUTES.parentalPassWord];

const isRouteAvailableToGuestUsers = (url: string) => {
  const isRouteAvailable = RESTRICTED_ROUTES.some((route) => {
    return !url.includes(route);
  });
  return isRouteAvailable;
};

export const redirectContinueAsGuestOnOTT = (): TubiThunkAction => {
  return (dispatch: TubiThunkDispatch, getState: () => StoreState) => {
    // close the left nav before redirecting to prevent users from immediately clicking "Sign In" again
    dispatch(closeLeftNav());
    const loginRedirectPath = loginRedirectSelector(getState(), { queryString: tubiHistory.getCurrentLocation().search });
    if (loginRedirectPath && isRouteAvailableToGuestUsers(loginRedirectPath)) {
      tubiHistory.replace(loginRedirectPath);
      // clear the loginRedirect since the user is still unauthenticated
      dispatch(loginRedirect(undefined));
      return;
    }
    tubiHistory.goBack();
  };
};
