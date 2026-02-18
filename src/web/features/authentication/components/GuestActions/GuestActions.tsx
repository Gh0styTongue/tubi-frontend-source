import { EmailStroke } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { Location } from 'history';
import React, { useCallback } from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { Link } from 'react-router';
import type { MarkOptional } from 'ts-essentials';

import { attachRedirectCookie } from 'client/utils/auth';
import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import { WEB_ROUTES } from 'common/constants/routes';
import { loginRedirect } from 'common/features/authentication/actions/auth';
import { isInActivationFlow } from 'common/features/authentication/utils/url';
import tubiHistory from 'common/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { isAddAccountFlow } from 'web/features/authentication/utils/auth';

import styles from './GuestActions.scss';

const messages = defineMessages({
  register: {
    description: 'register button text',
    defaultMessage: 'Register with Email',
  },
  continue: {
    description: 'alternative register button text',
    defaultMessage: 'Continue with Email',
  },
  haveAccount: {
    description: 'have an account text',
    defaultMessage: 'Have an account?',
  },
  signInLink: {
    description: 'sign in link text',
    defaultMessage: 'Sign in',
  },
  termsAgreement: {
    description: 'legal agreement copy for terms and privacy',
    defaultMessage: 'By registering, you agree to Tubi\'s <termsLink>Terms of Use</termsLink> and <privacyLink>Privacy Policy</privacyLink>',
  },
  or: {
    description: 'or, as in "this or that"',
    defaultMessage: 'or',
  },
});

type EventCallback = (e: Event) => void;

export const enum FormType {
  SIGNIN = 'SIGNIN',
  REGISTER = 'REGISTER',
  ACTIVATE = 'ACTIVATE',
}

type Props = {
  dispatch: TubiThunkDispatch,
  redirect: Pick<MarkOptional<Location, 'search'>, 'pathname' | 'search'>,
  children?: (handleEmailRegister: EventCallback, handleSignIn: EventCallback) => React.ReactElement,
  className?: string,
  showDivider?: boolean,
  formType?: FormType,
  signInLink?: string;
  registerLink?: string;
};

export const generateRedirectUrl = (redirect: Props['redirect'], encodeURIParam = true) => {
  const { pathname, search = '' } = redirect;
  return pathname + (encodeURIParam ? encodeURIComponent(search) : search);
};

const GuestActions: React.FC<Props> = (props) => {
  const intl = useIntl();

  const location = tubiHistory.getCurrentLocation();

  const isCompactView = isInActivationFlow() || isAddAccountFlow(location);

  const {
    dispatch,
    children,
    className,
    showDivider = true,
    formType,
    redirect,
    registerLink,
    signInLink,
  } = props;

  const redirectToEmailRegister = useCallback((e: any) => {
    e.preventDefault();
    const redirectUrl = generateRedirectUrl(redirect, false);
    attachRedirectCookie(redirectUrl);
    tubiHistory.push({
      pathname: registerLink || WEB_ROUTES.register,
      query: {
        redirect: redirectUrl,
      },
    });
  }, [redirect, registerLink]);

  const redirectToSignIn = useCallback((e: any) => {
    e.preventDefault();
    const redirectUrl = generateRedirectUrl(redirect, false);
    attachRedirectCookie(redirectUrl);
    tubiHistory.push({
      pathname: signInLink || WEB_ROUTES.signIn,
      query: {
        redirect: redirectUrl,
      },
    });
  }, [redirect, signInLink]);

  const attachRedirectCookieForGoogle = useCallback(/* istanbul ignore next */() => {
    const redirectUrl = generateRedirectUrl(redirect, false);
    attachRedirectCookie(redirectUrl);
    // we don't navigate away from this page with google, and post login is handled on client, so set redirect this way
    dispatch(loginRedirect(redirectUrl));
  }, [dispatch, redirect]);

  if (children) {
    return children(redirectToEmailRegister, redirectToSignIn);
  }

  const buttonClass = classNames(styles.authChoiceButton, styles.button);

  return (
    <div className={classNames(styles.activateButtonContainer, className)}>
      <SSOButtonGroup
        googleOnClick={attachRedirectCookieForGoogle}
        googleClass={styles.button}
      />
      {showDivider ? (
        <div className={styles.activateDivider}>{intl.formatMessage(messages.or).toUpperCase()}</div>
      ) : null}
      <Button
        icon={EmailStroke}
        iconAlignment="left"
        color="primary"
        className={buttonClass}
        onClick={redirectToEmailRegister}
      >
        {intl.formatMessage(formType === FormType.ACTIVATE ? messages.continue : messages.register)}
      </Button>
      {isCompactView ? (
        <div className={styles.signIn}>
          <Button
            appearance="tertiary"
            onClick={redirectToSignIn}
            className={styles.authChoiceButton}
          >{intl.formatMessage(messages.signInLink)}</Button>
        </div>
      ) : (
        <div className={styles.signInContainer}>
          <div>
            <span className={styles.haveAccount}>
              {intl.formatMessage(messages.haveAccount)}
            </span>
            &nbsp;
            <span onClick={redirectToSignIn} className={styles.link}>
              {intl.formatMessage(messages.signInLink)}
            </span>
          </div>
          <span className={styles.terms}>
            {intl.formatMessage(messages.termsAgreement, {
              termsLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.terms}>{msg}</Link>,
              privacyLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.privacy}>{msg}</Link>,
            })}
          </span>
        </div>
      )}
    </div>
  );
};

export default GuestActions;
