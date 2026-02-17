import { TextInput, Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FormikProps, FormikBag, WithFormikConfig } from 'formik';
import { withFormik } from 'formik';
import React from 'react';
import type { MouseEvent } from 'react';
import type { IntlShape } from 'react-intl';
import { injectIntl } from 'react-intl';
import { Link } from 'react-router';

import SSOButtonGroup from 'common/components/SSOButtonGroup/SSOButtonGroup';
import OrDivider from 'common/components/uilib/OrDivider/OrDivider';
import {
  REGISTRATION_FORM_FIELD_NAMES,
} from 'common/constants/constants';
import { WEB_ROUTES } from 'common/constants/routes';
import type { CredentialsData } from 'common/features/authentication/types/auth';
import { EmailType } from 'common/features/authentication/types/auth';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { hasEmptyStringValue, checkIfKeysExist } from 'common/utils/collection';
import ComposedField from 'web/components/ComposedField/ComposedField';

import styles from './CredentialsForm.scss';
import messages from './credentialsFormMessages';
import PreprocessError from './PreprocessError';
import { handleSubmit, validate } from './utils';

/**
 * Issue: https://app.shortcut.com/tubi/story/861086/fix-sign-up-form-links-click-issue
 * https://github.com/jaredpalmer/formik/issues/2062
 * https://github.com/redux-form/redux-form/issues/860
 * In Formik, when user click a link outside of the form with validateOnBlur & autoFocus set,
 * 1. the link mousedown causes focus to lost and triggers onBlur.
 * 2. the onBlur then causes DOM to shift and invalidate the synthetic onClick.
 * Fix: set `onMouseDown={preventDefault}` to stop the onBlur on clicking link.
 */
const preventDefault = /* istanbul ignore next */ (e: MouseEvent) => {
  e.preventDefault();
};

const {
  FIRST_NAME,
  EMAIL,
  PASSWORD,
  SUBMIT,
} = REGISTRATION_FORM_FIELD_NAMES;

export type FormValues = CredentialsData;

interface Target {
  name: string;
  value: string;
}
interface FormEvent {
  target: Target
}

export interface Props {
  dispatch: TubiThunkDispatch; // pass in as a prop to be used in handleSubmit
  intl: IntlShape;
  onSubmit: (formikBag: FormikBagWithProps, data: any) => void;
  trackRegisterProcess?: (e: FormEvent) => void;
  isMobile: boolean;
  signInLink?: string;
  loginRedirect?: string;
}

export const CredentialsForm: React.FunctionComponent<Props & FormikProps<FormValues>> = ({
  handleSubmit,
  status = {
    emailExists: false,
  },
  isSubmitting,
  errors,
  values,
  intl,
  trackRegisterProcess,
  isMobile,
  signInLink = WEB_ROUTES.signIn,
}) => {
  const { formatMessage } = intl;

  const h5Cls = classNames('H5', styles.h5);
  const areErrorsPresent = checkIfKeysExist(errors);
  const hasEmptyValue = hasEmptyStringValue(values);

  // if submitting or there are validation/form errors, do not allow submit
  const disableSubmit = isSubmitting || areErrorsPresent || hasEmptyValue;

  return (
    <div className={styles.main} data-test-id="credentials-form-refresh">
      <div className={styles.headers}>
        <h1 className={styles.header}>{formatMessage(messages.welcome)}</h1>
        <div className={styles.subheader}>{formatMessage(messages.free)}</div>
      </div>
      <SSOButtonGroup />
      <OrDivider className={styles.orDivider} inverted />
      <h5 className={h5Cls}>{formatMessage(messages.emailRegHeading)}</h5>
      <form className={styles.formContainer} onSubmit={handleSubmit} noValidate>
        <PreprocessError
          formatMessage={formatMessage}
          signInLink={signInLink}
          status={status}
        />
        <ComposedField
          containerClass={styles.inputContainer}
          component={TextInput}
          name={FIRST_NAME}
          label={formatMessage(messages.firstNameLabel)}
          maxLength={60}
          autoComplete="given-name"
          autoFocus={!isMobile}
          handleBlur={trackRegisterProcess}
        />
        <ComposedField
          containerClass={styles.inputContainer}
          component={TextInput}
          name={EMAIL}
          type="email"
          label={formatMessage(messages.emailLabel)}
          hint={formatMessage(messages.emailHint)}
          autoComplete="email"
          handleBlur={trackRegisterProcess}
        />
        <ComposedField
          containerClass={styles.inputContainer}
          component={TextInput}
          name={PASSWORD}
          type="password"
          label={formatMessage(messages.passwordLabel)}
          hint={formatMessage(messages.passwordHint)}
          canShowPassword
        />
        <div className={styles.submitWrapper}>
          <Button
            name={SUBMIT}
            type="submit"
            appearance={disableSubmit && !isSubmitting ? 'tertiary' : 'primary'}
            disabled={disableSubmit}
            className={styles.button}
            width="theme"
            loading={isSubmitting}
          >
            {formatMessage(messages.registerButtonLabel)}
          </Button>
        </div>
        <div className={styles.statement} onMouseDown={preventDefault}>
          <p>
            {formatMessage(messages.termsAgreement, {
              termsLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.terms}>{msg}</Link>,
              privacyLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={WEB_ROUTES.privacy}>{msg}</Link>,
            })}
          </p>
          <p>
            {formatMessage(messages.ownedAccountMessage, {
              signInLink: ([msg]: React.ReactNode[]) => <Link className={styles.link} to={signInLink}>{msg}</Link>,
            })}
          </p>
        </div>
      </form>
    </div>
  );
};

export type FormikBagWithProps = FormikBag<Props, FormikProps<FormValues>>;

export const withFormikConfig: WithFormikConfig<Props, FormValues> = {
  mapPropsToValues: () => ({
    firstName: '',
    email: '',
    emailType: EmailType.MANUAL,
    password: '',
  }),
  validateOnBlur: true,
  validateOnChange: true,
  validate,
  handleSubmit: handleSubmit as unknown as ((values: CredentialsData, formikBag: FormikBag<Props, CredentialsData>) => void),
};

const credentialsFormWithFormik = withFormik(withFormikConfig)(CredentialsForm);

export default injectIntl(credentialsFormWithFormik);
