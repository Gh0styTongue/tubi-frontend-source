import type { Location } from 'history';
import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { connect } from 'react-redux';

import AvatarIcon from 'common/components/uilib/SvgLibrary/AvatarIcon';
import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import WebRegistrationMagicLink from 'common/experiments/config/webRegistrationMagicLink';
import useExperiment from 'common/hooks/useExperiment';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import Footer from 'web/components/Footer/Footer';
import LoginForm from 'web/features/authentication/components/LoginForm/LoginForm';
import { getCanonicalMeta } from 'web/features/seo/utils/seo';

import styles from './Login.scss';

export interface StateProps {
  isMobile: boolean;
  email?: string;
  loginRedirect?: string;
  loginCallback?: (() => void) | null;
}

interface Props extends StateProps {
  dispatch: TubiThunkDispatch;
}

interface RouteLocation {
  location: Location;
}

export const Login: React.FC<Props> = ({
  dispatch,
  email,
  isMobile,
  loginCallback,
  loginRedirect,
}) => {
  const meta = { link: [getCanonicalMeta('login')] };

  const magicLink = useExperiment(WebRegistrationMagicLink);

  useEffect(() => {
    magicLink.logExposure();
  }, [magicLink]);

  return (
    <div className={styles.content}>
      <Helmet {...meta} />
      <TopPlaceholder logo invert register redirect={loginRedirect} />
      <div className={styles.loginWrapper}>
        <div className={styles.circle}>
          <AvatarIcon className={styles.icon} />
        </div>
        <LoginForm
          dispatch={dispatch}
          email={email}
          loginRedirect={loginRedirect}
          loginCallback={loginCallback}
          isMobile={isMobile}
          magicLinkOption={magicLink.getValue()}
        />
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

function mapStateToProps(state: StoreState, { location }: RouteLocation): StateProps {
  const { auth, ui: { isMobile } } = state;
  const { redirect, e: email } = location.query || {};
  // taking the redirect url from the query. e.g. '/login?redirect=/activate' or from auth in Redux store
  const loginRedirect = redirect || auth.loginRedirect;

  return {
    loginCallback: auth.loginCallback,
    loginRedirect: loginRedirect as string | undefined,
    email: email as string | undefined,
    isMobile,
  };
}

export default connect(mapStateToProps)(Login);
