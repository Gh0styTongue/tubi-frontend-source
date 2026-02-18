import { resolve } from '@adrise/utils/lib/resolver';
import { ActionStatus, Manipulation, Messages } from '@tubitv/analytics/lib/authEvent';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React from 'react';
import type { IntlShape } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

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
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { trackAccountEvent } from 'common/utils/analytics';
import { trackLogging } from 'common/utils/track';
import conf from 'src/config';
import { GOOGLE_AUTH_FAILED } from 'web/components/TubiNotifications/notificationTypes';

import styles from './GoogleButton.scss';

type CodeClient = google.accounts.oauth2.CodeClient;

export interface Props {
  label: string;
  className?: string;
  onClick?: () => void;
  icon?: React.FunctionComponent;
  dispatch: TubiThunkDispatch;
}

export type AllProps = Props & {
  intl: IntlShape;
};

interface State {
  loading: boolean;
}

export class GoogleButton extends React.PureComponent<AllProps, State> {
  private static auth2?: CodeClient;

  state: State = { loading: false };

  private clicked?: boolean;

  private apiLoadSuccess?: boolean;

  private mounted = false;

  private shouldShowNotification = false;

  componentDidMount() {
    resolve(GOOGLE_IDENTITY_SERVICE).then(() => {
      const codeClient = window.google.accounts.oauth2.initCodeClient({
        client_id: /* istanbul ignore next */ conf?.google?.clientID,
        scope: 'https://www.googleapis.com/auth/userinfo.email',
        ux_mode: 'popup',
        callback: this.handleCodeResponse,
        error_callback: this.handleAuthError,
      });
      GoogleButton.auth2 = codeClient;
      this.setApiLoadSuccess(true);
    }).catch((err) => {
      this.shouldShowNotification = true;
      this.setApiLoadSuccess(false);
      trackLogging({
        type: TRACK_LOGGING.clientInfo,
        subtype: LOG_SUB_TYPE.REGISTRATION.GOOGLE_SIGN_IN_ERROR,
        message: `GoogleButton.componentDidMount - ${err ? err.stack || err.message : undefined}`,
      });
      logger.error(err, 'Error initializing google auth api');
    });
    this.mounted = true;
  }

  private setApiLoadSuccess(success: boolean): void {
    this.apiLoadSuccess = success;
    if (this.clicked) {
      this.handleGoogleAuth();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleCodeResponse = (response: any) => {
    const { dispatch } = this.props;
    const { code } = response;
    dispatch(loginWithGoogle({
      code,
      method: GOOGLE_LOGIN_METHOD.SIGNIN_WITH_GOOGLE,
    })).catch((error) => {
      let message;
      if (isAuthServerError(error)) {
        message = Messages.AUTH_FAIL;
        redirectToAuthErrorPage(error, { type: 'signIn' });
      } else {
        message = Messages.AUTH_FAIL_WITH_FALLBACK;
        this.shouldShowNotification = true;
      }
      trackAccountEvent({
        manip: Manipulation.SIGNIN,
        current: 'GOOGLE',
        message,
        status: ActionStatus.FAIL,
      });
      this.setApiLoadSuccess(false);
    });
    this.setState({ loading: false });
  };

  /* istanbul ignore next */
  handleAuthError = (err: Error) => {
    logger.error(err, 'Error when sign in on google auth api');
    this.setState({ loading: false });
  };

  private handleGoogleAuth() {
    if (!GoogleButton.auth2 || !this.mounted || !this.clicked) {
      return;
    }
    const { dispatch, onClick } = this.props;
    if (this.shouldShowNotification) {
      dispatch(addNotification(GOOGLE_AUTH_FAILED.notification, 'google-auth'));
    }
    if (!this.apiLoadSuccess) {
      trackAccountEvent({
        manip: Manipulation.SIGNIN,
        current: 'GOOGLE',
        message: Messages.AUTH_FAIL_WITH_FALLBACK,
        status: ActionStatus.FAIL,
      });
      this.setState({ loading: false });
      return;
    }
    onClick?.();
    GoogleButton.auth2.requestCode();
  }

  handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    this.clicked = true;
    if (this.apiLoadSuccess === undefined) {
      this.setState({ loading: true });
    } else {
      this.handleGoogleAuth();
    }
  };

  render() {
    const { label, className, icon } = this.props;
    const Icon = icon;

    return (
      <Button
        appearance="secondary"
        className={classNames(styles.button, className)}
        icon={Icon}
        iconAlignment="left"
        loading={this.state.loading}
        onClick={this.handleClick}
        type="button"
      >
        {label}
      </Button>
    );
  }
}

export default injectIntl(connect()(GoogleButton)) as React.FC<Props>;
