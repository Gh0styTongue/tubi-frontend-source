import { EmailStroke } from '@tubitv/icons';
import type { Location } from 'history';
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch } from 'react-redux';

import AvatarIcon from 'common/components/uilib/SvgLibrary/AvatarIcon';
import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import WebRegistrationMagicLink from 'common/experiments/config/webRegistrationMagicLink';
import { loginCallbackSelector, loginRedirectSelector } from 'common/features/authentication/selectors/auth';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import Footer from 'web/components/Footer/Footer';
import LoginForm from 'web/features/authentication/components/LoginForm/LoginForm';
import { getCanonicalMeta } from 'web/features/seo/utils/seo';

import styles from './EnterPassword.scss';

const EnterPassword = ({ location }: { location: Location }) => {
  const dispatch = useDispatch();
  const meta = { link: [getCanonicalMeta('enterPassword')] };
  const loginRedirect = useAppSelector(state => loginRedirectSelector(state, { queryString: location.search }));
  const loginCallback = useAppSelector(loginCallbackSelector);
  const isMobile = useAppSelector((state) => state.ui.isMobile);
  const email = location.query.email as string | undefined;
  const magicLink = useExperiment(WebRegistrationMagicLink);
  const magicLinkOption = magicLink.getValue();

  return (
    <div className={styles.content}>
      <Helmet {...meta} />
      <TopPlaceholder logo invert register redirect={loginRedirect} />
      <div className={styles.loginWrapper}>
        <div className={styles.circle}>
          {magicLinkOption === 'password_first' ? <EmailStroke /> : <AvatarIcon className={styles.icon} />}
        </div>
        <LoginForm
          step2
          dispatch={dispatch}
          email={email}
          loginRedirect={loginRedirect}
          loginCallback={loginCallback}
          isMobile={isMobile}
          magicLinkOption={magicLinkOption}
        />
      </div>
      <Footer useRefreshStyle />
    </div>

  );
};

export default EnterPassword;
