import classnames from 'classnames';
import type { Location } from 'history';
import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useStore } from 'react-redux';
import type { Store } from 'redux';

import { getLocalData } from 'client/utils/localDataStorage';
import { addTransitionCompleteHook, addNotification } from 'common/actions/ui';
import { LD_DISABLE_ONE_TAP_AUTO_SELECT } from 'common/constants/constants';
import { GOOGLE_IDENTITY_SERVICE } from 'common/constants/resources';
import { useLocation } from 'common/context/ReactRouterModernContext';
import {
  load as loadAuth,
  loginWithGoogle,
  loginRedirect,
} from 'common/features/authentication/actions/auth';
import { GOOGLE_LOGIN_METHOD } from 'common/features/authentication/constants/auth';
import { isAuthServerError, redirectToAuthErrorPage } from 'common/features/authentication/utils/error';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMajorEventActiveSelector } from 'common/selectors/remoteConfig';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import { loadScript } from 'common/utils/dom';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { getUrlParam } from 'common/utils/urlManipulation';
import config from 'src/config';
import { GOOGLE_AUTH_FAILED } from 'web/components/TubiNotifications/notificationTypes';
import {
  shouldShowOneTapPromptSelector,
  useFedCMForPromptSelector,
} from 'web/features/authentication/selectors/googleOneTap';
import { routeGroup, hasMatchedRoutes } from 'web/features/authentication/utils/googleOneTap';

import styles from './OneTap.scss';

import CredentialResponse = google.accounts.id.CredentialResponse;

export async function handleGoogleOneTap(
  dispatch: TubiThunkDispatch,
  credential: string,
  redirectWithParams: boolean,
  store: Store<StoreState>,
  location: Location,
  selectBy: string,
) {
  const state = store.getState();
  let redirect = getCurrentPathname();
  if (redirectWithParams) {
    const params = {
      ...getUrlParam(),
      ...(hasMatchedRoutes(routeGroup.detailRoutes, redirect) ? {
        startPos: state.player.progress.position,
      } : {}),
    };
    const search = Object.keys(params)
      .map((k) => `${k}=${params[k]}`)
      .join('&');
    redirect += `?${search}`;
  }
  dispatch(loginRedirect(redirect));

  // sync user state from server
  await dispatch(loadAuth(location));
  // skip login if user already exists
  const { auth } = state;
  if (auth.user) return;

  try {
    await dispatch(loginWithGoogle({
      idToken: credential,
      method: GOOGLE_LOGIN_METHOD.GOOGLE_ONE_TAP,
    }));
  } catch (error) {
    /**
     * When web users automatically sign in via OneTap, we don't need to redirect them to the auth error page on a 500 error.
     * https://developers.google.com/identity/gsi/web/reference/js-reference#select_by
     */
    const isAutoOneTap = selectBy && ['auto', 'fedcm_auto'].includes(selectBy);
    const shouldHandleAuthError = !isAutoOneTap;
    if (isAuthServerError(error, isMajorEventActiveSelector(state)) && shouldHandleAuthError) {
      redirectToAuthErrorPage(error, { type: 'signIn' });
    } else {
      dispatch(addNotification(GOOGLE_AUTH_FAILED.notification, 'google-auth'));
    }
  }
}

const OneTap = () => {
  const dispatch = useDispatch();
  const store = useStore<StoreState>();
  const location = useLocation();
  const shouldShowOneTapPrompt = useAppSelector(state => shouldShowOneTapPromptSelector(state, { pathname: location.pathname }));
  const useFedCMForPrompt = useAppSelector(useFedCMForPromptSelector);
  const currentPath = getCurrentPathname();
  const isInDetailPage = hasMatchedRoutes(routeGroup.detailRoutes, currentPath);
  const redirectWithParamsRef = useRef(false);
  const isInActivatePage = hasMatchedRoutes(routeGroup.activateRoutes, currentPath);

  const id = 'GoogleOneTap';
  const className = classnames(styles.oneTap, {
    [styles.inActivate]: isInActivatePage,
  });

  const togglePrompt = useCallback((googleOneTap: typeof window.google.accounts.id) => {
    if (shouldShowOneTapPrompt) {
      googleOneTap.prompt?.();
    } else {
      googleOneTap.cancel?.();
    }
  }, [shouldShowOneTapPrompt]);

  const initPrompt = useCallback(() => {
    loadScript(GOOGLE_IDENTITY_SERVICE).then(() => {
      // Google One Tap
      // https://developers.google.com/identity/one-tap/web/reference/js-reference
      const autoSelect = getLocalData(LD_DISABLE_ONE_TAP_AUTO_SELECT) !== 'true';
      window.google.accounts.id.initialize({
        client_id: config.google.clientID,
        prompt_parent_id: id,
        auto_select: autoSelect,
        context: 'signin',
        callback: /* istanbul ignore next */ ({ credential, select_by }: CredentialResponse) => {
          handleGoogleOneTap(dispatch, credential, redirectWithParamsRef.current, store, location, select_by);
        },
        cancel_on_tap_outside: false,
        use_fedcm_for_prompt: useFedCMForPrompt,
      } as google.accounts.id.IdConfiguration);
      togglePrompt(window.google.accounts.id);
    });
  }, [dispatch, store, togglePrompt, useFedCMForPrompt, location]);

  useEffect(() => {
    redirectWithParamsRef.current = isInActivatePage || isInDetailPage;
  }, [isInDetailPage, isInActivatePage]);

  useEffect(() => {
    if (window.google?.accounts?.id) {
      const googleOneTap = window.google.accounts.id;
      if (useFedCMForPrompt) {
        dispatch(addTransitionCompleteHook(() => {
          togglePrompt(googleOneTap);
        }));
      } else {
        togglePrompt(googleOneTap);
      }
    } else {
      initPrompt();
    }
  // add currentPath to deps to trigger togglePrompt/initPrompt on every navigation
  }, [dispatch, initPrompt, togglePrompt, currentPath, useFedCMForPrompt]);

  const props = {
    id,
    ...(useFedCMForPrompt ? undefined : { className }),
  };

  return <div {...props} />;
};

export default OneTap;
