import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import type { HelmetProps } from 'react-helmet-async';
import { useIntl } from 'react-intl';
import { withRouter } from 'react-router';
import type { WithRouterProps } from 'react-router';

import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { WEB_ROUTES } from 'common/constants/routes';
import { isLoggedInSelector, loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import { userSettingsSelector } from 'common/selectors/userSettings';
import Footer from 'web/components/Footer/Footer';
import SignUpForm from 'web/features/authentication/components/CredentialsForm/SignUpForm';
import authMessages from 'web/features/authentication/constants/auth-message';
import addKidsMessages from 'web/features/authentication/containers/AddKids/messages';

import styles from './common.scss';
import SignUpPending from './SignUpPending';

interface SignUpProps extends WithRouterProps {
  meta: HelmetProps;
}

const SignUp = ({ isFromAddKids }: { isFromAddKids: boolean }) => {
  const { formatMessage } = useIntl();
  const header = isFromAddKids ? addKidsMessages.guestHeader : authMessages.activateHeader;
  const description = isFromAddKids ? addKidsMessages.guestDesc : authMessages.free;
  return (
    <>
      <header>
        {isFromAddKids ? (
          <img src="https://mcdn.tubitv.com/tubitv-assets/img/account/illustration/RabbitHole.svg" width="62" height="68" alt="Rabbit hole illustration" />
        ) : (
          <img src="https://mcdn.tubitv.com/tubitv-assets/img/account/illustration/Key.svg" width="52" height="68" alt="Key illustration" />
        )}
        <h1>{formatMessage(header)}</h1>
        <p>{formatMessage(description)}</p>
      </header>
      <main>
        <SSOButtonGroup />
        <SignUpForm />
      </main>
    </>
  );
};

const SignUpWithCoppa = ({ meta, location }: SignUpProps) => {
  const loginRedirect = useAppSelector(state => loginRedirectSelector(state, { queryString: location.search }));
  const isFromAddKids = loginRedirect.split('?')[0] === WEB_ROUTES.addKids;

  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const { coppaState } = useAppSelector(userSettingsSelector);
  const requireAgeForPatch = isLoggedIn && coppaState === UserCoppaStates.REQUIRE_AGE_GATE;
  // isSubmittingAgeGate is an extra flag to prevent blink.
  // Once AgeGate is submitted, user's coppaState will be COPPA_COMPLIANT, then before redirection `requireAgeForPatch` will be false.
  // This ensures that we still display `SignUpPending` (AgeGate) before redirection.
  const [isSubmittingAgeGate, setIsSubmittingAgeGate] = useState(false);
  /* istanbul ignore next */
  const useAgeGateForm = requireAgeForPatch || isSubmittingAgeGate;

  return (
    <>
      <div className={styles.wrapper} data-test-id="container-sign-up-with-coppa-compact">
        <Helmet {...meta} />
        <TopPlaceholder logo invert login={!useAgeGateForm} redirect={loginRedirect} />
        {useAgeGateForm ? (
          <SignUpPending setSubmitting={setIsSubmittingAgeGate} />
        ) : (
          <SignUp isFromAddKids={isFromAddKids} />
        )}
      </div>
      <Footer useRefreshStyle />
    </>
  );
};

export default withRouter(SignUpWithCoppa);
