import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { EmailStroke } from '@tubitv/icons';
import { Button, ErrorMessage } from '@tubitv/web-ui';
import type { Location } from 'history';
import React, { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { Link } from 'react-router';

import { setCookie } from 'client/utils/localDataStorage';
import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { COOKIE_CONTAINERS_CACHE_KEY } from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import WebRegistrationMagicLink from 'common/experiments/config/webRegistrationMagicLink';
import { clearLoginActions } from 'common/features/authentication/actions/auth';
import messages from 'common/features/authentication/constants/signInWithMagicLinkMessages';
import { loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import { createSignInWithMagicLinkObservables } from 'common/features/authentication/utils/magicLink';
import { isCoppaEnabledSelector } from 'common/features/coppa/selectors/coppa';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { isMajorEventActiveSelector } from 'common/selectors/remoteConfig';
import Footer from 'web/components/Footer/Footer';
import { getCanonicalMeta } from 'web/features/seo/utils/seo';

import styles from './SignInWithMagicLink.scss';

const useSignInWithMagicLink = (email: string | undefined, location: Location) => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const observablesRef = useRef<ReturnType<typeof createSignInWithMagicLinkObservables> | null>(null);
  const [showEmailSent, setShowEmailSent] = useState<boolean>(false);
  const isCoppaEnabled = useAppSelector(isCoppaEnabledSelector);
  const loginCallback = useAppSelector((state) => state.auth.loginCallback);
  const loginRedirect = useAppSelector(state => loginRedirectSelector(state, { queryString: location.search }));
  const isMajorEventActive = useAppSelector(isMajorEventActiveSelector);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSuccessfulLogin = (hasAge: boolean | undefined) => {
    let redirect: string = loginRedirect || WEB_ROUTES.home;
    if (isCoppaEnabled && !hasAge) {
      redirect = WEB_ROUTES.register;
    }

    // set cacheKey so that the homescreen tensor request will not be cached by the browser
    /* istanbul ignore next */
    setCookie(COOKIE_CONTAINERS_CACHE_KEY, `${Date.now()}`, 300);

    // if there is a loginCall back call the function here
    if (loginCallback) loginCallback();

    // Redirect to loginRedirect or default to '/home'
    tubiHistory.replace(redirect);
    if (loginRedirect || loginCallback) {
      dispatch(clearLoginActions());
    }

    /* istanbul ignore else */
    if (window) {
      // coppa refactor. we use hard redirect and this leads to doing a birthday check on server/render.js L239
      window.location.href = (redirect as string) || WEB_ROUTES.home;
    }
    setErrorMessage('');
  };

  useEffect(() => {
    observablesRef.current = createSignInWithMagicLinkObservables({
      location,
      dispatch,
      email,
      isMajorEventActive,
      onSuccessfulLogin: ({ hasAge }) => handleSuccessfulLogin(hasAge),
      onSendEmailError: () => setErrorMessage(formatMessage(messages.tooManyAttempts)),
      onCheckStatusError: () => setErrorMessage(formatMessage(messages.checkStatusError)),
      onTooManyAttempts: () => setErrorMessage(formatMessage(messages.tooManyAttempts)),
      onShowEmailSent: (show: boolean) => setShowEmailSent(show),
    });
    const { sendEmail, destroy } = observablesRef.current;

    sendEmail(false);

    return () => {
      destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ourSendEmail = () => {
    setErrorMessage('');
    observablesRef.current?.sendEmail(true);
  };

  return {
    showEmailSent,
    sendEmail: ourSendEmail,
    formatMessage,
    errorMessage,
  };
};

const SignInWithMagicLink = ({ location }: { location: Location }) => {
  const helmetProps = { link: [getCanonicalMeta('signInWithMagicLink')] };
  const loginRedirect = useAppSelector((state) => loginRedirectSelector(state, { queryString: location.search }));
  const email = location.query.email as string | undefined;
  const { showEmailSent, sendEmail, formatMessage, errorMessage } = useSignInWithMagicLink(email, location);
  const magicLink = useExperiment(WebRegistrationMagicLink);
  const magicLinkFirst = magicLink.getValue() === 'magic_link_first';
  const enterPasswordRoute = addQueryStringToUrl(WEB_ROUTES.enterPassword, {
    email,
    redirect: loginRedirect || WEB_ROUTES.home,
  });

  return (
    <div className={styles.root}>
      <Helmet {...helmetProps} />
      <TopPlaceholder logo invert register redirect={loginRedirect} />
      <div className={styles.wrapper}>
        <div className={styles.iconWrapper}>
          <EmailStroke />
        </div>
        <div className={styles.header}>{formatMessage(messages.headerWeb)}</div>
        <div className={styles.content}>
          <div>{formatMessage(messages.subjectWeb)}</div>
          <div className={styles.email}>{email}</div>
          <div>{formatMessage(messages.notificationWeb)}</div>
          <div className={styles.tip}>{formatMessage(messages.notification2)}</div>
        </div>
        <Button className={styles.button} appearance="tertiary" width="theme" onClick={() => sendEmail()}>
          {formatMessage(messages.resendWeb)}
          {showEmailSent && <span className={styles.emailSent}>{formatMessage(messages.emailSent)}</span>}
        </Button>
        {errorMessage && <ErrorMessage className={styles.errorMessage} message={errorMessage} />}
        {magicLinkFirst && (
          <div className={styles.enterPassword}>
            {formatMessage(messages.enterPassword, {
              or: ([text]: React.ReactNode[]) => <span className={styles.or}>{text}</span>,
              link: ([text]: React.ReactNode[]) => <Link className={styles.link} to={enterPasswordRoute}>{text}</Link>,
            })}
          </div>
        )}
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export default SignInWithMagicLink;
