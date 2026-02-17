import { ActionStatus, Manipulation, Messages, UserType } from '@tubitv/analytics/lib/authEvent';
import { EmailStroke, Shield } from '@tubitv/icons';
import { Button, ErrorMessage, TextInput } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FormikBag, FormikProps, WithFormikConfig } from 'formik';
import { withFormik } from 'formik';
import type { Location } from 'history';
import React from 'react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import TopPlaceholder from 'common/components/uilib/TopPlaceholder/TopPlaceholder';
import { WEB_ROUTES } from 'common/constants/routes';
import { REGEX_EMAIL_VALIDATION } from 'common/constants/validate-rules';
import { loginRedirect as setLoginRedirect } from 'common/features/authentication/actions/auth';
import { sendResetPasswordEmail } from 'common/features/authentication/api/resetPassword';
import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import { isAuthServerError, redirectToAuthErrorPage } from 'common/features/authentication/utils/error';
import { isMajorEventActiveSelector } from 'common/selectors/remoteConfig';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type StoreState from 'common/types/storeState';
import { trackAccountEvent } from 'common/utils/analytics';
import { checkIfKeysExist } from 'common/utils/collection';
import ComposedField from 'web/components/ComposedField/ComposedField';
import Footer from 'web/components/Footer/Footer';

import styles from './Forgot.scss';
import messages from './forgotMessages';
import ResetSuccess from './Success';

export interface FormValues {
  email?: string;
  message?: string;
}

interface StateProps {
  email?: string;
  loginRedirect?: string;
  isMajorEventActive: boolean;
}

export interface OwnProps {
  location: Location;
}

export interface ForgotProps extends StateProps, OwnProps {
  isLoggedIn?: boolean;
  status?: {
    success?: boolean;
    formError?: string;
  };
  dispatch: TubiThunkDispatch;
  intl: IntlShape;
}

export const Forgot: React.FC<Omit<FormikProps<FormValues>, keyof ForgotProps> & ForgotProps> = ({
  handleSubmit,
  intl,
  isLoggedIn,
  isSubmitting,
  location,
  loginRedirect,
  status = {},
  values,
}) => {
  const { formatMessage } = intl;
  const { success, formError } = status;

  const Icon = success ? EmailStroke : Shield;

  let titleMessage = messages.titlePassword;
  let subtitleMessage = messages.subtitlePassword;
  let buttonMessage = messages.submitPassword;

  const isForgotPassword = location.pathname === WEB_ROUTES.forgotPassword;
  if (isForgotPassword) {
    titleMessage = messages.titleForgot;
    subtitleMessage = messages.subtitleForgot;
    buttonMessage = messages.submit;
  }
  const title = formatMessage(success ? messages.titleSuccess : titleMessage);
  const subtitle = formatMessage(success ? messages.subtitleSuccess : subtitleMessage);

  const areFieldsEmpty = !checkIfKeysExist(values);
  const disableSubmit = isSubmitting || areFieldsEmpty;

  return (
    <div className={styles.content} data-test-id="forgot-refresh">
      <TopPlaceholder logo invert login={!isLoggedIn} register={!isLoggedIn} redirect={loginRedirect} />
      <div className={styles.forgotWrapper}>
        <div className={classnames(styles.circle, {
          [styles.filled]: success,
        })}
        >
          <Icon className={styles.icon} />
        </div>
        <div className={styles.main}>
          <div className={styles.headers}>
            <h1 className={styles.header}>{title}</h1>
            <div className={styles.subheader}>{subtitle}</div>
          </div>
          {formError && !isSubmitting ? (
            <ErrorMessage className={styles.errorContainer} message={formError} />
          ) : null}
          {success ? (
            <ResetSuccess loginRedirect={loginRedirect} />
          ) : (
            <form className={styles.formContainer} onSubmit={handleSubmit} noValidate>
              <ComposedField
                name="email"
                component={TextInput}
                type="email"
                label={formatMessage(messages.email)}
                hint={formatMessage(messages.hint)}
                autoComplete="email"
                autoFocus
              />
              <Button
                name="submit"
                type="submit"
                appearance={disableSubmit ? 'tertiary' : 'primary'}
                disabled={disableSubmit}
                className={styles.submitButton}
                width="theme"
              >
                <FormattedMessage {...buttonMessage} />
              </Button>
            </form>
          )}
        </div>
      </div>
      <Footer useRefreshStyle />
    </div>
  );
};

export const validate = (values: FormValues, { intl }: { intl: IntlShape }): FormValues => {
  let emailError = null;
  if (!values.email) {
    emailError = intl.formatMessage(messages.required);
  }

  if (values.email && !REGEX_EMAIL_VALIDATION.test(values.email)) {
    emailError = intl.formatMessage(messages.error);
  }

  return emailError ? { email: emailError } : {};
};

export const handleSubmit = (data: FormValues, formikBag: FormikBag<ForgotProps, FormValues>) => {
  const baseEventProps = {
    manip: Manipulation.CHANGEPW,
    userType: UserType.EXISTING_USER,
  };
  const { props, setSubmitting, setStatus } = formikBag;
  const { dispatch, isMajorEventActive, isLoggedIn } = props;
  if (!data.email) {
    data.email = '';
  }
  return dispatch(sendResetPasswordEmail(data.email))
    .then(() => {
      trackAccountEvent({
        ...baseEventProps,
        message: Messages.SUCCESS,
        status: ActionStatus.SUCCESS,
      });
      setSubmitting(false);
      setStatus({ success: true, formError: '' });
    })
    .catch((error) => {
      const { message: formError } = error;
      trackAccountEvent({
        ...baseEventProps,
        message: Messages.ERROR,
        status: ActionStatus.FAIL,
      });
      setSubmitting(false);
      if (isAuthServerError(error, isMajorEventActive) && !isLoggedIn) {
        dispatch(setLoginRedirect(WEB_ROUTES.home));
        redirectToAuthErrorPage(error, { type: 'activate' });
      } else {
        setStatus({ success: false, formError });
      }
    });
};

export const withFormikConfig: WithFormikConfig<ForgotProps, FormValues> = {
  mapPropsToValues: ({ email }) => ({ email: email || '' }), // auto-populate the email field if user is authenticated
  validateOnBlur: false,
  validateOnChange: false,
  validate,
  handleSubmit,
};

const forgotWithFormik = withFormik(withFormikConfig)(Forgot);

export const mapStateToProps = (state: StoreState, ownProps: OwnProps): StateProps => {
  const { auth, userSettings } = state;
  const { location: { query: { redirect } } } = ownProps;
  const loginRedirect = typeof redirect === 'string' ? redirect : auth.loginRedirect;
  const isLoggedIn = isLoggedInSelector(state);
  const email = userSettings?.email;
  const isMajorEventActive = isMajorEventActiveSelector(state);

  return {
    email,
    isLoggedIn,
    loginRedirect,
    isMajorEventActive,
  };
};

const connectedForgotForm = connect(mapStateToProps)(injectIntl(forgotWithFormik));

export default connectedForgotForm;
