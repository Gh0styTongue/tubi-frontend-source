import { ActionStatus, Manipulation, Messages } from '@tubitv/analytics/lib/authEvent';
import type { AuthType } from '@tubitv/analytics/lib/baseTypes';
import type { Location } from 'history';
import { defineMessages } from 'react-intl';
import type { Action } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import * as actions from 'common/constants/action-types';
import * as eventTypes from 'common/constants/event-types';
import { onActivateDeviceFlowFail } from 'common/features/authentication/actions/auth';
import { refreshToken } from 'common/features/authentication/actions/userToken';
import { registerDevice as enrollDevice, setParentalControls } from 'common/features/authentication/api/auth';
import { disableAccount, fetchUserSettings, patchUserSettings } from 'common/features/authentication/api/userSettings';
import type { DisableAccountParam } from 'common/features/authentication/api/userSettings';
import { loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import type { User, AuthError } from 'common/features/authentication/types/auth';
import type ApiClient from 'common/helpers/ApiClient';
import type { TubiThunkAction, TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import type { LoadUserSettingsResponse, UserSettingsState } from 'common/types/userSettings';
import { actionWrapper } from 'common/utils/action';
import { UserCoppaError, setCoppaCompliantCookie, setLockedInKidsModeCookie } from 'common/utils/ageGate';
import { buildRequestForInfoEventObject, trackAccountEvent } from 'common/utils/analytics';
import { getPlatform } from 'common/utils/platform';
import { isParentalRatingOlderKidsOrLess } from 'common/utils/ratings';
import { trackEvent } from 'common/utils/track';
import { getIntl } from 'i18n/intl';

import { loadHomeScreen } from './container';
import { setContainerGridActiveId } from './containerGrid';
import { setEspanolMode, setKidsMode } from './ui';

const messages = defineMessages({
  validPw: {
    description: 'Please enter a valid password error message',
    defaultMessage: 'Please enter a valid password',
  },
  invalidPassword: {
    description: 'text for invalid password',
    defaultMessage: 'Invalid password',
  },
});

export function setUserCoppaState(dispatch: TubiThunkDispatch, coppaState: string) {
  dispatch(actionWrapper(actions.SET_COPPA_STATE, { coppaState }));
}

export function setGuestUserCoppaState(dispatch: TubiThunkDispatch, coppaState: string) {
  // a util function to set coppa state in redux store and cookie at the same time
  setUserCoppaState(dispatch, coppaState);
  /* istanbul ignore else */
  if (coppaState === UserCoppaStates.COMPLIANT) {
    setCoppaCompliantCookie();
  } else if (coppaState === UserCoppaStates.NOT_COMPLIANT) {
    setLockedInKidsModeCookie();
  }
}

function handleCoppaError(dispatch: TubiThunkDispatch, error: AuthError) {
  let coppaState;
  if (error.httpCode === 422 || error.status === 422) {
    // Unprocessable Entity. User is below 13 years old
    coppaState = UserCoppaStates.NOT_COMPLIANT;
  } else if (error.httpCode === 451 || error.status === 451) {
    // Unavailable For Legal Reasons. User too young (non-US users), needs to be logout for legal reasons
    coppaState = UserCoppaStates.REQUIRE_LOGOUT;
  } else {
    // Unknown age, user needs to be age-gated
    coppaState = UserCoppaStates.REQUIRE_AGE_GATE;
  }
  setUserCoppaState(dispatch, coppaState);
  return coppaState;
}

export function loadUserSettingsSuccess(result: LoadUserSettingsResponse): TubiThunkAction {
  return (dispatch, getState) => {
    // run the parental kids mode check if isKidsModeEnabled is false
    // if ui.isKidsModeEnabled is true, it means that kids mode was enabled via the Call to Action
    if (!getState().ui.isKidsModeEnabled) {
      const isLittleOrOlderKidsMode = isParentalRatingOlderKidsOrLess(result.parentalRating);
      dispatch(setKidsMode(isLittleOrOlderKidsMode));
    }
    dispatch(actionWrapper(actions.LOAD_SETTINGS_SUCCESS, { result }));
  };
}

export function loadUserSettings(forced: boolean = false, token?: User['token']): TubiThunkAction<ThunkAction<Promise<LoadUserSettingsResponse | void>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    const state = getState();
    const { userSettings } = state;
    if (userSettings && userSettings.loaded && !forced) {
      return Promise.resolve();
    }

    dispatch(actionWrapper(actions.LOAD_SETTINGS));
    return dispatch(fetchUserSettings(token))
      .then((result) => {
        dispatch(loadUserSettingsSuccess(result));
        return Promise.resolve(result);
      })
      .catch((error: AuthError) => {
        dispatch(actionWrapper(actions.LOAD_SETTINGS_FAIL, { error }));
        return Promise.reject(error);
      });
  };
}

/**
 * After a user is logged in (SSO or email) and we need their age, we do not fire the account event (see auth.ts login actions)
 * because they are technically not able to see our site w/o an age.
 * For proper analytics and data, we need to fire it AFTER we have their age
 * Calling it here covers 2 login cases: email, google
 */
export function fireAuthEventAfterCOPPACheck(authType: AuthType, isNewUser: boolean, success: boolean) {
  const message = success ? Messages.SUCCESS : Messages.COPPA_FAIL;
  const status = success ? ActionStatus.SUCCESS : ActionStatus.FAIL;
  // google + email
  if (authType === 'GOOGLE' || authType === 'EMAIL') {
    trackAccountEvent({
      manip: isNewUser ? Manipulation.SIGNUP : Manipulation.SIGNIN,
      current: authType,
      message,
      status,
    });
  }
}

export function updateUserSettings(location: Location, newUserSettings: Partial<UserSettingsState>, sendAuthEvent = false): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    const { auth: { user } } = getState();
    const { authType, status } = user as Required<User>;
    const isNewUser = status === 'new';
    dispatch(actionWrapper(actions.UPDATE_SETTINGS));

    // if user adds age information from age gate modal, send RequestForInfoEvent to analytics
    if (newUserSettings && 'birthday' in newUserSettings) {
      trackEvent(eventTypes.REQUEST_FOR_INFO_EVENT, buildRequestForInfoEventObject({ birthday: newUserSettings.birthday! }));
      if ('gender' in newUserSettings) {
        trackEvent(eventTypes.REQUEST_FOR_INFO_EVENT, buildRequestForInfoEventObject({ gender: newUserSettings.gender! }));
      }
    }

    return dispatch(
      patchUserSettings(newUserSettings)
    ).then(() => {
      dispatch(actionWrapper(actions.UPDATE_SETTINGS_SUCCESS, { result: newUserSettings }));
      setUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
      if (sendAuthEvent) {
        fireAuthEventAfterCOPPACheck(authType, isNewUser, true);
      }
      return Promise.resolve();
    }).catch((error: AuthError) => {
      onActivateDeviceFlowFail(error, loginRedirectSelector(getState(), { queryString: location.search }));
      dispatch(actionWrapper(actions.UPDATE_SETTINGS_FAIL, { error }));
      const coppaState = handleCoppaError(dispatch, error);
      if (error.httpCode === 422 && sendAuthEvent) {
        fireAuthEventAfterCOPPACheck(authType, isNewUser, false);
      }
      return Promise.reject(new UserCoppaError(error, coppaState));
    });
  };
}

export type DeleteAccountParam = DisableAccountParam;

export function deleteAccount(data: DeleteAccountParam): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    const { ui } = getState();
    const intl = getIntl(ui.userLanguageLocale);

    dispatch(actionWrapper(actions.DELETE_ACCOUNT));
    return dispatch(disableAccount(data))
      .then(() => (
        dispatch(actionWrapper(actions.DELETE_ACCOUNT_SUCCESS))
      )).catch((error: AuthError) => {
        let deleteError = error;
        if (error && error.status === 403) {
          deleteError = new Error(intl.formatMessage(messages.invalidPassword)) as AuthError;
        }
        dispatch(actionWrapper(actions.DELETE_ACCOUNT_FAIL, { error: deleteError }));
        return Promise.reject(error);
      });
  };
}

/**
 * @param rating number 0-4
 * @param password
 * error message is sent directly to OTTParental and Parental.
 */
export function updateParental(location: Location, rating: number, password: string): TubiThunkAction<ThunkAction<Promise<unknown>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    // this will return 400 Bad Request from UAPI; use custom msg instead
    if (password.length < 6 || password.length > 30) {
      const { ui } = getState();
      const intl = getIntl(ui.userLanguageLocale);
      return Promise.reject(intl.formatMessage(messages.validPw));
    }

    return dispatch(setParentalControls({
      rating,
      password,
    })).then(() => {
      dispatch(actionWrapper(actions.UPDATE_PARENTAL_SUCCESS, { result: rating }));
      dispatch(setKidsMode(isParentalRatingOlderKidsOrLess(rating)));
      dispatch(setEspanolMode(false));
      dispatch(setContainerGridActiveId(''));
      return dispatch(refreshToken());
    }).then(() => (
      dispatch(loadHomeScreen({ location, force: true }))
    )).catch((error: AuthError) => {
      return Promise.reject(error.message);
    });
  };
}

/*
 * @param birthday YYYY-MM-DD
 * Link birthday information with device id for guest
 */
export function registerDevice(birthday: string): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    const state = getState();
    const { auth: { deviceId } } = state;
    trackEvent(eventTypes.REQUEST_FOR_INFO_EVENT, buildRequestForInfoEventObject({ birthday }));
    const options = {
      data: {
        platform: getPlatform(),
        device_id: deviceId,
        birthday,
      },
    };
    return dispatch(enrollDevice(options.data))
      .then(() => {
        setUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
      }).catch((error: AuthError) => {
        const coppaState = handleCoppaError(dispatch, error);
        return Promise.reject(new UserCoppaError(error, coppaState));
      });
  };
}

/*
 * @param birthday YYYY-MM-DD
 * Send birthday information for guest or logged-in user
 */
export function updateUserBirthday(location: Location, birthday: string): TubiThunkAction<ThunkAction<Promise<void>, StoreState, ApiClient, Action>> {
  return (dispatch, getState) => {
    const { auth: { user } } = getState();
    if (user) {
      return dispatch(updateUserSettings(location, { birthday }));
    }
    return dispatch(registerDevice(birthday));
  };
}
