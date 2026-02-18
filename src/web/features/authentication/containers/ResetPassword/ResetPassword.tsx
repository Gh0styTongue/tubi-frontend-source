import type { Location } from 'history';
import React from 'react';
import { connect } from 'react-redux';

import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { StoreState } from 'common/types/storeState';
import Footer from 'web/components/Footer/Footer';

import InvalidContent from './InvalidContent/InvalidContent';
import styles from './ResetPassword.scss';
import ResetPasswordForm from './ResetPasswordForm/ResetPasswordForm';

export interface OwnProps {
  location: Location;
}

interface ResetPasswordProps {
  dispatch: TubiThunkDispatch;
  isLoaded?: boolean;
  isValid?: boolean;
  loginRedirect?: string;
  token: string | null;
  userId?: string;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({
  dispatch,
  isLoaded,
  isValid,
  loginRedirect,
  token,
  userId,
}) => (
  <div className={styles.content} data-test-id="reset-password-refresh">
    <TopPlaceholder logo invert login register redirect={loginRedirect} />
    {isLoaded && isValid ? (
      <ResetPasswordForm token={token as string} userId={userId as string} dispatch={dispatch} />
    ) : (
      <InvalidContent />
    )}
    <Footer useRefreshStyle />
  </div>
);

export function mapStateToProps(state: StoreState, ownProps: OwnProps) {
  const { auth, pwdReset } = state;
  const { location: { query: { redirect } } } = ownProps;
  const loginRedirect = typeof redirect === 'string' ? redirect : auth.loginRedirect;
  return {
    isLoaded: pwdReset.loaded,
    isValid: pwdReset.isValid,
    loginRedirect,
    token: pwdReset.token,
    userId: pwdReset.userId,
  };
}

export default connect(mapStateToProps)(ResetPassword);
