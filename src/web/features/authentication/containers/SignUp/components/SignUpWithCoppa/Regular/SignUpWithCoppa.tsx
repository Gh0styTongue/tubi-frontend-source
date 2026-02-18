import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import type { Location } from 'history';
import React from 'react';
import type { HelmetProps } from 'react-helmet-async';
import { Helmet } from 'react-helmet-async';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';

import { isInSuitest } from 'client/setup/tasks/setupSuitest';
import Mail from 'common/components/uilib/SvgLibrary/Mail';
import ThumbsUpIcon from 'common/components/uilib/SvgLibrary/ThumbsUpIcon';
import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { WEB_ROUTES } from 'common/constants/routes';
import {
  clearLoginActions,
  mockSuitestLogin,
  register,
  removeUserCredentials,
  storeCredentialsAndSetCoppaState,
} from 'common/features/authentication/actions/auth';
import { COPPA_ERROR_STATUS_CODES } from 'common/features/authentication/constants/auth';
import type {
  EnhancedAgeGateData,
  AuthError,
  User,
  UserCredentials,
} from 'common/features/authentication/types/auth';
import { UserCoppaStates } from 'common/features/authentication/types/auth';
import type { AgeGateFormikActions } from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import AgeGateProvider from 'common/features/coppa/components/AgeGateProvider/AgeGateProvider';
import { isCoppaEnabledSelector } from 'common/features/coppa/selectors/coppa';
import tubiHistory from 'common/history';
import FeatureSwitchManager from 'common/services/FeatureSwitchManager';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { isUserNotCoppaCompliant } from 'common/utils/ageGate';
import Footer from 'web/components/Footer/Footer';
import CircleIcon from 'web/features/authentication/components/CircleIcon/CircleIcon';
import type { FormikBagWithProps as FormikBagWithCredentialsProps } from 'web/features/authentication/components/CredentialsForm/CredentialsForm';
import CredentialsForm from 'web/features/authentication/components/CredentialsForm/CredentialsForm';
import { trackRegisterProcess, trackRegisterEvent, ProgressType } from 'web/features/authentication/utils/track';
import AgeGateForm from 'web/features/coppa/components/AgeGateForm/AgeGateForm';

import styles from './SignUpWithCoppa.scss';
import { fulfillUserInfo } from '../utils';

interface StateProps {
  isMobile: boolean;
  userCredentials?: UserCredentials | null;
  loginCallback?: (() => void) | null;
  loginRedirect?: string;
  coppaState?: UserCoppaStates;
  authType?: string;
  user?: User;
  isCoppaEnabled: boolean;
}

interface RouteProps {
  location: Location<{
    redirect: string;
  }>;
}

interface SignUpState {
  processedSubmission?: boolean;
  submitting: boolean;
}

type OwnProps = RouteProps;

interface SignUpProps extends StateProps, OwnProps {
  dispatch: TubiThunkDispatch;
  meta: HelmetProps;
}

/**
 * This component serves 2 purposes:
 * 1. Age Gate Page (similar to modal) for SSO users
 * 2. New Registration Flow with 2 steps
 *     1. Collect User Credentials (all but Age + Gender)
 *     2. Collect Age + Gender ==> Register
 */

export class SignUpWithCoppa extends React.Component<SignUpProps, SignUpState> {
  state: SignUpState = {
    submitting: false,
  };

  componentDidMount() {
    const { dispatch, isCoppaEnabled, loginRedirect, location } = this.props;
    if (isCoppaEnabled) {
      // if user tries to hit back button after entering bad age, check the cookie and redirect
      if (isUserNotCoppaCompliant()) {
        tubiHistory.replace(WEB_ROUTES.home);
      }
    }

    /* istanbul ignore next */
    if ((!__PRODUCTION__ || __IS_ALPHA_ENV__) && isInSuitest() && !FeatureSwitchManager.isDisabled(['mockSuitestLogin'])) {
      dispatch(mockSuitestLogin(location)).then(this.finishSubmission);
      tubiHistory.replace(loginRedirect || WEB_ROUTES.home);
    }
  }

  shouldComponentUpdate(nextProps: SignUpProps, nextState: SignUpState) {
    return !(nextState.processedSubmission || nextState.submitting);
  }

  componentWillUnmount() {
    const { dispatch } = this.props;
    dispatch(removeUserCredentials());
  }

  finishSubmission = () => {
    this.setState({ processedSubmission: true });
  };

  // get user credentials as part one of reg flow
  registrationStepOne = (formikBag: FormikBagWithCredentialsProps, data: UserCredentials) => {
    const { setSubmitting, setStatus } = formikBag;
    const { dispatch } = this.props;
    dispatch(storeCredentialsAndSetCoppaState(data));
    setSubmitting(false);
    setStatus({ formError: null });

    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  };

  // after we have the user credentials as step 1 of registration, we submit now that we have birthday + gender
  registrationStepTwo = (ageGateData: EnhancedAgeGateData, actions: AgeGateFormikActions) => {
    const {
      dispatch,
      loginCallback,
      loginRedirect,
      userCredentials,
      location,
    } = this.props;
    const { setStatus, setSubmitting } = actions;
    const registrationData = {
      ...ageGateData,
      ...userCredentials,
      authType: 'EMAIL' as const,
    };

    trackRegisterEvent({ progress: ProgressType.SUBMIT_AGE_GATE });

    this.setState({ submitting: true });
    // registering, collect already stored user credentials from part 1
    dispatch(register(location, registrationData)).then(() => {
      setStatus({ formError: null });
      // if there is a loginCall back call the function here
      if (loginCallback) loginCallback();
      // redirect to loginRedirect or default to '/home'
      tubiHistory.replace(loginRedirect || WEB_ROUTES.home);
      if (loginRedirect || loginCallback) {
        dispatch(clearLoginActions());
      }
    }).catch((error: AuthError) => {
      // We will not show the generic error message for COPPA errors. Fail scenario handled in register action.
      if (!COPPA_ERROR_STATUS_CODES.includes(error.status)) {
        setSubmitting(false);
        setStatus({ formError: error });
        this.setState({ submitting: false });
      }
    }).finally(() => {
      this.finishSubmission();
    });
  };

  // mainly for SSO, uses age gate page to update a logged in users age
  patchUserAge = (data: EnhancedAgeGateData, actions: AgeGateFormikActions) => {
    const { dispatch } = this.props;
    this.setState({ submitting: true });
    dispatch(fulfillUserInfo(data, actions))
      .finally(() => {
        this.finishSubmission();
      });
  };

  render() {
    const { dispatch, isMobile, user, userCredentials, coppaState, loginRedirect, meta } = this.props;
    const isLoggedIn = !!user;
    // get age if user is logged in but doesn't have age, OR we are on step 2 of registration (have credentials)
    const requireAgeForPatch = isLoggedIn && coppaState === UserCoppaStates.REQUIRE_AGE_GATE;
    const requireAgeForRegistration = !!userCredentials;
    const useAgeGateForm = requireAgeForPatch || requireAgeForRegistration;
    const Icon = useAgeGateForm ? ThumbsUpIcon : Mail;
    // age gate form can do 2 things. patch age for a logged in user with no age, or complete a registration
    const handleAgeSubmit = requireAgeForPatch
      ? this.patchUserAge
      : this.registrationStepTwo;

    return (
      <div className={styles.main} data-test-id="container-sign-up-with-coppa">
        <Helmet {...meta} />
        <TopPlaceholder logo invert login={!useAgeGateForm} redirect={loginRedirect} />
        <div className={styles.registrationWrapper}>
          <div className={styles.icon}>
            <CircleIcon iconComponent={Icon} />
          </div>
          {useAgeGateForm ? (
            <AgeGateProvider onSubmit={handleAgeSubmit} isRegistering hasGenderField>
              {(childrenProps) => (
                <AgeGateForm
                  {...childrenProps}
                  trackRegisterProcess={requireAgeForRegistration ? trackRegisterProcess : undefined}
                  username={userCredentials?.firstName || user?.name}
                  isRegistering
                  hasGenderField
                />
              )}
            </AgeGateProvider>
          ) : (
            <CredentialsForm
              dispatch={dispatch}
              isMobile={isMobile}
              onSubmit={this.registrationStepOne}
              trackRegisterProcess={trackRegisterProcess}
              signInLink={loginRedirect ? addQueryStringToUrl(WEB_ROUTES.signIn, {
                redirect: loginRedirect,
              }) : WEB_ROUTES.signIn}
              loginRedirect={loginRedirect}
            />
          )}
        </div>
        <Footer useRefreshStyle />
      </div>
    );
  }
}

export const mapStateToProps = (state: StoreState, ownProps: OwnProps): StateProps => {
  const { ui: { isMobile }, auth, userSettings } = state;
  const { userCredentials, user, loginCallback } = auth;
  const isCoppaEnabled = isCoppaEnabledSelector(state);
  const { coppaState } = userSettings;
  let authType;
  if (user) {
    authType = (user as User).authType;
  }
  const { location: { query: { redirect } } } = ownProps;
  const loginRedirect = redirect || auth.loginRedirect;

  return {
    isMobile,
    userCredentials,
    loginCallback,
    loginRedirect,
    authType,
    user: user as User,
    isCoppaEnabled,
    coppaState,
  };
};

const connected = connect(mapStateToProps)(SignUpWithCoppa);

export default withRouter(connected);
