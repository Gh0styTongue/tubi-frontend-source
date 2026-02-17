import type { Location } from 'history';
import React from 'react';
import type { HelmetProps } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import { connect } from 'react-redux';

import Mail from 'common/components/uilib/SvgLibrary/Mail';
import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import Footer from 'web/components/Footer/Footer';
import RegistrationForm from 'web/features/authentication/components/RegistrationForm/RegistrationForm';

import styles from './SignUpWithoutCoppa.scss';

interface StateProps {
  isMobile: boolean;
  loginRedirect?: string;
  loginCallback?: (() => void) | null;
  userLanguageLocale: string;
}

interface Props extends StateProps {
  dispatch: TubiThunkDispatch;
  meta: HelmetProps;
}

interface RouteLocation {
  location: Location<{
    redirect: string;
  }>;
}

export const SignUpWithoutCoppa: React.FC<Props> = ({ isMobile, dispatch, loginRedirect, loginCallback, userLanguageLocale, meta }) => {
  return (
    <div className={styles.content}>
      <Helmet {...meta} />
      <TopPlaceholder logo invert login redirect={loginRedirect} />
      <div className={styles.registrationWrapper}>
        <div className={styles.circle}>
          <Mail className={styles.icon} />
        </div>
        <RegistrationForm
          isMobile={isMobile}
          dispatch={dispatch}
          loginRedirect={loginRedirect}
          loginCallback={loginCallback}
          userLanguageLocale={userLanguageLocale}
        />
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

const mapStateToProps = (state: StoreState, { location }: RouteLocation): StateProps => {
  const { auth, ui } = state;
  const loginRedirect = location.query.redirect || auth.loginRedirect;
  const { isMobile, userLanguageLocale } = ui;

  return {
    loginCallback: auth.loginCallback,
    loginRedirect,
    isMobile,
    userLanguageLocale,
  };
};

export default connect(mapStateToProps)(SignUpWithoutCoppa);
