import { addQueryStringToUrl } from '@adrise/utils/lib/queryString';
import { Button, ErrorMessage, TextInput } from '@tubitv/web-ui';
import type { FormikProps, WithFormikConfig } from 'formik';
import { withFormik } from 'formik';
import some from 'lodash/some';
import React, { useCallback } from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router';

import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import OrDivider from 'common/components/uilib/OrDivider/OrDivider';
import { WEB_ROUTES } from 'common/constants/routes';
import type { TreatmentValue } from 'common/experiments/config/webRegistrationMagicLink';
import { checkEmail } from 'common/features/authentication/actions/auth';
import { isCoppaEnabledSelector } from 'common/features/coppa/selectors/coppa';
import tubiHistory from 'common/history';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import type { RouteCode } from 'common/types/route-codes';
import type StoreState from 'common/types/storeState';
import ComposedField from 'web/components/ComposedField/ComposedField';

import styles from './LoginForm.scss';
import messages from './loginFormMessages';
import type { FormValues, StateProps, IntlProps } from './types';
import { handleSubmit, validate } from './utils';

interface OwnProps {
  magicLinkOption: TreatmentValue;
  isMobile: boolean;
  email?: string;
  step2?: boolean;
  loginRedirect?: string;
  loginCallback?: (() => void) | null;
  dispatch: TubiThunkDispatch;
}

export interface LoginFormProps extends OwnProps, StateProps, IntlProps {}

export type AllProps = LoginFormProps & FormikProps<FormValues>;

export const LoginForm: React.FC<AllProps> = (props) => {
  const {
    dispatch,
    isSubmitting,
    handleSubmit,
    status = {},
    intl,
    isMobile,
    loginRedirect,
    values,
    magicLinkOption,
    step2,
  } = props;
  const { formError } = status;
  const { formatMessage } = intl;

  const registerLink = loginRedirect ? addQueryStringToUrl(WEB_ROUTES.register, {
    redirect: loginRedirect,
  }) : WEB_ROUTES.register;

  const areFieldsEmpty = some(values, value => value === '');
  const disableSubmit = isSubmitting || areFieldsEmpty;

  const handleSignInWithoutPassword = useCallback(() => {
    let nextRoute: string = registerLink;
    dispatch(checkEmail(values.email)).then((code: RouteCode) => {
      if (code === 'TAKEN') {
        nextRoute = addQueryStringToUrl(WEB_ROUTES.signInWithMagicLink, {
          email: values.email,
          redirect: loginRedirect || WEB_ROUTES.home,
        });
      }
    }).finally(() => {
      tubiHistory.push(nextRoute);
    });
  }, [dispatch, loginRedirect, registerLink, values.email]);

  const errorMessage = magicLinkOption === 'on_invalid_password' ? (
    <div>
      {formError}<br />
      {formatMessage(messages.signInWithoutPassword, {
        signInLink: ([msg]: React.ReactNode[]) => <span
          role="button"
          tabIndex={0}
          className={styles.errorLink}
          onClick={handleSignInWithoutPassword}
        >{msg}</span>,
      })}
    </div>
  ) : formError;

  const header = step2 ?
    (magicLinkOption === 'password_first' ?
      formatMessage(messages.magicLinkSignIn) :
      formatMessage(messages.enterYourPassword)) :
    formatMessage(messages.welcome);
  const formHeader = step2 ?
    (magicLinkOption === 'password_first' ?
      formatMessage(messages.enterYourPassword) :
      null) :
    (magicLinkOption === 'on_invalid_password' ?
      formatMessage(messages.emailSignIn) :
      formatMessage(messages.magicLinkSignIn));

  return (
    <div className={styles.main} data-test-id="login-form-refresh">
      <h1 className={styles.header}>{header}</h1>
      <div className={styles.contentWrapper}>
        {(!step2 || magicLinkOption !== 'magic_link_first') && (
          <>
            {step2 ? (
              <div>
                <div className={styles.emailAddressLabel}>{formatMessage(messages.emailAddress)}</div>
                <div className={styles.emailAddress}>{values.email}</div>
                <Button className={styles.button} appearance="primary" width="theme" onClick={handleSignInWithoutPassword}>
                  {formatMessage(messages.magicLinkButton)}
                </Button>
              </div>
            ) : (
              <SSOButtonGroup googleClass={styles.button} />
            )}
            <OrDivider className={styles.orDivider} inverted />
          </>
        )}
        {formHeader && <h2 className={styles.subheader}>{formHeader}</h2>}
        <form
          className={styles.loginFormWrapper}
          onSubmit={handleSubmit}
          noValidate
          method="POST"
        >
          {formError && !isSubmitting ? (
            <ErrorMessage message={errorMessage} data-test-id="errorText" />
          ) : null}
          {(!step2 || magicLinkOption === 'magic_link_first') && (
            <ComposedField
              component={TextInput}
              name="email"
              label={formatMessage(messages.emailLabel)}
              autoFocus={!isMobile}
              type="email"
              autoComplete="email"
              containerClass={styles.inputContainer}
            />
          )}
          {(step2 || magicLinkOption === 'on_invalid_password') && (
            <ComposedField
              component={TextInput}
              name="password"
              label={formatMessage(messages.passwordLabel)}
              type="password"
              autoComplete="password"
              containerClass={styles.inputContainer}
              canShowPassword
            />
          )}
          <div className={styles.submitWrapper}>
            <Button
              className={styles.submitButton}
              name="submit"
              type="submit"
              appearance={disableSubmit ? 'tertiary' : 'primary'}
              disabled={disableSubmit}
              width="theme"
              loading={isSubmitting}
            >
              {formatMessage(step2 || magicLinkOption === 'on_invalid_password' ? messages.signInButtonLabel : messages.continueButtonLabel)}
            </Button>
          </div>
          <div className={styles.statement}>
            {(step2 || magicLinkOption === 'on_invalid_password') && (
              <div>
                <Link className={styles.link} to={WEB_ROUTES.forgotPassword} data-test-id="forgotLink">
                  {formatMessage(messages.forgotPassword)}
                </Link>
              </div>
            )}
            {(!step2 || magicLinkOption === 'magic_link_first') && (
              <div>
                {formatMessage(messages.noAccountPrompt)}
                {' '}
                <Link className={styles.link} to={registerLink}>
                  {formatMessage(messages.registerLink)}
                </Link>
              </div>
            )}
          </div>
          <div className={styles.subStatement}>
            <p>
              {formatMessage(messages.termsAgreement, {
                termsLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.terms}>{msg}</Link>,
                privacyLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.privacy}>{msg}</Link>,
              })}
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export const withFormikConfig: WithFormikConfig<LoginFormProps, FormValues> = {
  mapPropsToValues(props) {
    if (!props.step2 && props.magicLinkOption !== 'on_invalid_password') {
      return { email: props.email || '' };
    }
    return { email: props.email || '', password: '' };
  },
  validateOnChange: false,
  validateOnBlur: false,
  validate,
  handleSubmit,
};

const LoginFormWithFormik = withFormik(withFormikConfig)(LoginForm);

export const mapStateToProps = (state: StoreState): StateProps => {
  return {
    isCoppaEnabled: isCoppaEnabledSelector(state),
  };
};

export default connect(mapStateToProps)(injectIntl(LoginFormWithFormik)) as React.FC<Partial<AllProps> & { dispatch?: TubiThunkDispatch }>;
