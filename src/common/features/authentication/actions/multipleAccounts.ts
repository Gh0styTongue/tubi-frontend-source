import Analytics from '@tubitv/analytics';
import type { AnalyticsConfigProps } from '@tubitv/analytics/lib/baseTypes';

import { setCookie } from 'client/utils/localDataStorage';
import { loadHomeScreen } from 'common/actions/container';
import { KidsModeEligibilityModalTypes, showKidsModeEligibilityModal } from 'common/actions/ottUI';
import { setKidsMode, setShowSignInToast } from 'common/actions/ui';
import { loadUserSettings, setGuestUserCoppaState } from 'common/actions/userSettings';
import * as actions from 'common/constants/action-types';
import { COOKIE_CONTAINERS_CACHE_KEY, HOME_DATA_SCOPE } from 'common/constants/constants';
import { OTT_ROUTES } from 'common/constants/routes';
import {
  clearLogin,
  clearUserRelatedData,
  handleSuccessfulLogin,
  loginCallback,
  onLoginCanceled,
  reloadForUser,
  setupLoggedInUser,
  validatePINCallback,
} from 'common/features/authentication/actions/auth';
import { syncAnonymousTokensAndSetTubiId } from 'common/features/authentication/actions/tubiId';
import { isLoggedInSelector, userSelector } from 'common/features/authentication/selectors/auth';
import type { AuthThunk, UserOrKid } from 'common/features/authentication/types/auth';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import { checkIsKidAccount } from 'common/features/authentication/utils/user';
import { isCoppaExitKidsModeEnabledSelector } from 'common/features/coppa/selectors/coppa';
import logger from 'common/helpers/logging';
import tubiHistory from 'common/history';
import { isKidsModeEnabledSelector } from 'common/selectors/ui';
import { hasPINSelector, parentalRatingSelector } from 'common/selectors/userSettings';
import { actionWrapper } from 'common/utils/action';
import { doesAgeGateCookieExist, removeLockedInKidsModeCookie, setLockedInKidsModeCookie } from 'common/utils/ageGate';
import { delay } from 'common/utils/async';
import { isRatingUpgrade } from 'common/utils/ratings';
import { saveUserSessionToLocalStorage } from 'ott/features/authentication/utils/userSession';
import type { AgeGateLocationState } from 'ott/features/coppa/containers/AgeGatePage/AgeGatePage';

interface RedirectOptions {
  redirectPath?: string;
  canUseLoadingScreen?: boolean;
}

// TODO: In order to support experimentation based on Tubi ID,
// we will need to refetch Popper here using the new Tubi ID when the user state changes.
export const updateUserState = (user: UserOrKid | null): AuthThunk<void> => {
  return (dispatch) => {
    if (user) {
      dispatch(actionWrapper(actions.LOAD_AUTH_SUCCESS, { result: user }));
    } else {
      dispatch(actionWrapper(actions.LOGOUT_SUCCESS));
    }
    Analytics.mergeConfig(
      (): AnalyticsConfigProps => ({
        user_id: user ? `${user.userId}` : undefined,
        auth_type: user ? user.authType : 'NOT_AUTHED',
      })
    );
  };
};

const replaceOrGoBack = (path?: RedirectOptions['redirectPath']) => {
  if (path) {
    tubiHistory.replace(path);
  } else {
    tubiHistory.goBack();
  }
};

const redirectUser = (redirectPath?: RedirectOptions['redirectPath']): AuthThunk<void> => {
  return (dispatch, getState) => {
    if (isLoggedInSelector(getState())) {
      dispatch(handleSuccessfulLogin(redirectPath));
      dispatch(clearLogin());
    } else {
      replaceOrGoBack(redirectPath);
    }
  };
};

export const callWithLoader = ({
  job,
  redirectPath,
  canUseLoadingScreen,
  user,
}: RedirectOptions & { job: () => Promise<unknown>, user?: UserOrKid }): AuthThunk<Promise<void>> => {
  return async (dispatch) => {
    if (canUseLoadingScreen) {
      // use intermediate loading screen and redirect after the job is done
      tubiHistory.replace({ pathname: OTT_ROUTES.accountsLoading, state: { user } });
      await Promise.all([delay(2000), job()]);
      dispatch(redirectUser(redirectPath));
    } else {
      // redirect immediately and handle loading on the next screen (e.g. use Home screen placeholder)
      dispatch(actionWrapper(actions.SET_CHANGING_USER_STATE, { isChangingUserState: true }));
      await job();
      dispatch(redirectUser(redirectPath));
      dispatch(actionWrapper(actions.SET_CHANGING_USER_STATE, { isChangingUserState: false }));
    }
  };
};

interface CallWithGateOptions {
  user?: UserOrKid;
  callback: () => Promise<void>;
  cancelGoBack?: boolean;
}

export const callWithGate = ({ callback, cancelGoBack = false, user }: CallWithGateOptions): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const state = getState();
    const currentUser = userSelector(state);
    const currentRating = parentalRatingSelector(state);
    const isCoppaExitKidsModeEnabled = isCoppaExitKidsModeEnabledSelector(state);
    const isKidsModeEnabled = isKidsModeEnabledSelector(state);
    const hasPIN = hasPINSelector(getState());

    const isRegisteredKid = checkIsKidAccount(currentUser as UserOrKid) && hasPIN; // TODO: update this logic once we confirmed how to identify current account is kid or adult
    const isGuestKid = !currentUser && isKidsModeEnabled;
    const isSwitchToAdult = !checkIsKidAccount(user);
    const isSwitchToOlderKid = checkIsKidAccount(user) && isRatingUpgrade({ currentRating, updatedRating: user.parentalRating });
    const isGateNeeded = isSwitchToAdult || isSwitchToOlderKid || isGuestKid;

    if (!isGateNeeded) {
      await callback();
      return;
    }

    if (isRegisteredKid) {
      dispatch(
        validatePINCallback(
          /* istanbul ignore next */ () => {
            callback();
            return { cancelGoBack };
          }
        )
      );
      tubiHistory.push(OTT_ROUTES.enterPIN);
      return;
    }

    if (isGuestKid) {
      const hasAgeGateCookie = doesAgeGateCookieExist();
      const isAgeGateRequired = !hasAgeGateCookie && isCoppaExitKidsModeEnabled;
      if (isAgeGateRequired) {
        const ageGateState: AgeGateLocationState = {
          noBackground: true,
          onUserCompliant: /* istanbul ignore next */ () => {
            setGuestUserCoppaState(dispatch, UserCoppaStates.COMPLIANT);
            callback();
          },
          onUserNotCompliant: /* istanbul ignore next */ () => {
            setGuestUserCoppaState(dispatch, UserCoppaStates.NOT_COMPLIANT);
            setLockedInKidsModeCookie();
            dispatch(showKidsModeEligibilityModal(KidsModeEligibilityModalTypes.CANNOT_EXIT));
            tubiHistory.push(OTT_ROUTES.home);
          },
        };
        tubiHistory.push({
          pathname: OTT_ROUTES.ageGate,
          state: ageGateState,
        });
        return;
      }
    }

    await callback();
  };
};

const _setGuestMode = (): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    const isLoggedIn = isLoggedInSelector(getState());

    if (isLoggedIn) {
      // If a logged-in user selects "Continue as Guest", we should not clear the `userSession` in local storage.
      // We should only clear user data from redux for the current session.
      // If we need to rollback or cancel the MVP experiment, then userSession will still be available in
      // local storage the next time the app is loaded.
      // We don't want to unintentionally log the user out.
      dispatch(updateUserState(null));
      dispatch(setKidsMode(false));
      await dispatch(syncAnonymousTokensAndSetTubiId());

      try {
        await dispatch(clearUserRelatedData(tubiHistory.getCurrentLocation()));
      } catch (error) {
        logger.error(error, 'Error clearing user data in _setGuestMode');
      }
    } else {
      const location = tubiHistory.getCurrentLocation();
      try {
        await dispatch(
          loadHomeScreen({
            scope: HOME_DATA_SCOPE.firstScreen,
            location,
          })
        );
      } catch (error) {
        logger.error(error, 'Error loading home screen in _setGuestMode');
      }
    }
  };
};

export const setGuestMode = ({
  redirectPath,
  canUseLoadingScreen,
}: RedirectOptions = {}): AuthThunk<Promise<void>> => {
  return async (dispatch) => {
    const callback = () => {
      const job = () => dispatch(_setGuestMode());
      return dispatch(callWithLoader({ job, redirectPath, canUseLoadingScreen }));
    };
    await dispatch(callWithGate({
      callback,
      cancelGoBack: canUseLoadingScreen,
    }));
  };
};

const _setActiveUser = (user: UserOrKid): AuthThunk<Promise<void>> => {
  return async (dispatch, getState) => {
    try {
      const forceSwitchKidsMode = isLoggedInSelector(getState());

      dispatch(updateUserState(user));
      await saveUserSessionToLocalStorage(user);

      // need to call this before fetching homescreen for the new user
      await dispatch(setupLoggedInUser());

      // set cacheKey so that the homescreen tensor request will not be cached by the browser
      setCookie(COOKIE_CONTAINERS_CACHE_KEY, `${Date.now()}`, 300);

      removeLockedInKidsModeCookie();

      // Load user settings before loading home screen to keep it synced
      await dispatch(loadUserSettings(true, user.token, forceSwitchKidsMode));
      await dispatch(reloadForUser(tubiHistory.getCurrentLocation(), user));

      // Show sign-in toast after successfully setting active user
      dispatch(setShowSignInToast(true));
    } catch (error) {
      logger.error(error, 'Error in setActiveUser');
    }
  };
};

export const setActiveUser = ({
  user,
  redirectPath,
  canUseLoadingScreen,
  shouldBypassGate = false,
}: RedirectOptions & { user: UserOrKid, shouldBypassGate?: boolean }): AuthThunk<Promise<void>> => {
  return async (dispatch) => {
    const callback = () => {
      const job = () => dispatch(_setActiveUser(user));
      return dispatch(callWithLoader({ job, redirectPath, canUseLoadingScreen, user }));
    };
    if (shouldBypassGate) {
      await callback();
      return;
    }
    await dispatch(callWithGate({
      user,
      callback,
      cancelGoBack: canUseLoadingScreen,
    }));
  };
};

// When `from` parameter is provided (e.g. on the Account Picker page), use `replace` to navigate.
// When `from` is not provided, use `push` to navigate and `goBack` to return.
export const goToActivate = (from?: string): AuthThunk<void> => {
  return (dispatch, getState) => {
    dispatch(
      onLoginCanceled(() => {
        replaceOrGoBack(from);
      })
    );

    const currentLoginCallback = getState().auth.loginCallback;
    // Show sign-in toast after successfully active new user
    dispatch(loginCallback(() => {
      // istanbul ignore else
      if (currentLoginCallback) {
        currentLoginCallback();
      }
      dispatch(setShowSignInToast(true));
    }));

    // Use allowLoggedInUser query param to override the noLoginRequired route hook
    const destination = {
      pathname: OTT_ROUTES.activate,
      query: { allowLoggedInUser: true },
    };
    if (from) {
      tubiHistory.replace(destination);
    } else {
      tubiHistory.push(destination);
    }
  };
};
