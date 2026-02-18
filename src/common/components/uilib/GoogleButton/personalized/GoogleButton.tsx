import { resolve } from '@adrise/utils/lib/resolver';
import { ActionStatus, Manipulation, Messages } from '@tubitv/analytics/lib/authEvent';
import React, { useRef, useCallback, useEffect } from 'react';

import { addNotification } from 'common/actions/ui';
import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { GOOGLE_IDENTITY_SERVICE } from 'common/constants/resources';
import { loginWithGoogle } from 'common/features/authentication/actions/auth';
import { GOOGLE_LOGIN_METHOD } from 'common/features/authentication/constants/auth';
import {
  isAuthServerError,
  redirectToAuthErrorPage,
} from 'common/features/authentication/utils/error';
import logger from 'common/helpers/logging';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { trackAccountEvent } from 'common/utils/analytics';
import { trackLogging } from 'common/utils/track';
import conf from 'src/config';
import { GOOGLE_AUTH_FAILED } from 'web/components/TubiNotifications/notificationTypes';

import styles from './GoogleButton.scss';

type CredentialResponse = google.accounts.id.CredentialResponse;

export interface Props {
  onClick?: () => void;
}

const GoogleButton = ({ onClick }: Props) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const languageLocale = useAppSelector((state) => state.ui.userLanguageLocale);
  const dispatch = useAppDispatch();

  const showNotification = useCallback(() => {
    dispatch(addNotification(GOOGLE_AUTH_FAILED.notification, 'google-auth'));
  }, [dispatch]);

  const handleResponse = useCallback(({ credential }: CredentialResponse) => {
    dispatch(loginWithGoogle({
      idToken: credential,
      method: GOOGLE_LOGIN_METHOD.GOOGLE_PERSONALIZED_BUTTON,
    })).catch((error) => {
      let message;
      if (isAuthServerError(error)) {
        message = Messages.AUTH_FAIL;
        redirectToAuthErrorPage(error, { type: 'signIn' });
      } else {
        message = Messages.AUTH_FAIL_WITH_FALLBACK;
        showNotification();
      }
      trackAccountEvent({
        manip: Manipulation.SIGNIN,
        current: 'GOOGLE',
        message,
        status: ActionStatus.FAIL,
      });
    });
  }, [dispatch, showNotification]);

  const handleAuthError = useCallback((err: any) => {
    logger.error(err, 'Error initializing google auth api - personalized button');
    showNotification();
    trackLogging({
      type: TRACK_LOGGING.clientInfo,
      subtype: LOG_SUB_TYPE.REGISTRATION.GOOGLE_SIGN_IN_ERROR,
      message: `GoogleButton.handleAuthError - ${err?.stack || err?.message}`,
    });
  }, [showNotification]);

  // `onClick` would change, but calling `google.accounts.id.renderButton` multiple times would not set the config again.
  // Personalized button only remembers the config when we set it the first time.
  // Therefore, we need to use a reference to make sure it will call the latest callback function.
  const clickListener = useLatest(onClick);

  useEffect(() => {
    resolve(GOOGLE_IDENTITY_SERVICE).then(() => {
      /* istanbul ignore next */
      if (!buttonRef.current) {
        return;
      }
      // buttonWidth = 312 (container width) / 1.3 (scale)
      const buttonWidth = 240;
      google.accounts.id.initialize({
        client_id: conf.google.clientID,
        callback: handleResponse,
        use_fedcm_for_button: true,
        button_auto_select: true,
      } as google.accounts.id.IdConfiguration);
      google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: buttonWidth,
        text: 'continue_with',
        locale: languageLocale,
        click_listener: /* istanbul ignore next */ () => clickListener.current?.(),
      });
    }).catch(handleAuthError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.button} ref={buttonRef} />
  );
};

export default GoogleButton;
