import { Button, ErrorMessage, TextInput } from '@tubitv/web-ui';
import type { FormikProps, WithFormikConfig } from 'formik';
import { withFormik } from 'formik';
import some from 'lodash/some';
import React from 'react';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';

import { isCoppaEnabledSelector } from 'common/features/coppa/selectors/coppa';
import useAppSelector from 'common/hooks/useAppSelector';
import { uiSelector } from 'common/selectors/ui';
import type StoreState from 'common/types/storeState';
import ComposedField from 'web/components/ComposedField/ComposedField';

import styles from './LoginForm.scss';
import messages from './loginFormMessages';
import type { FormValues, LoginComponentProps, StateProps } from './types';
import { validate, handleSubmit } from './utils';

type LoginCredentialsFormProps = LoginComponentProps;

export type AllProps = LoginCredentialsFormProps & FormikProps<Required<FormValues>>;

export const LoginCredentialsForm = (props: AllProps) => {
  const {
    isSubmitting,
    handleSubmit,
    status = {},
    intl,
    values,
  } = props;
  const { formError } = status;
  const { formatMessage } = intl;

  const areFieldsEmpty = some(values, value => value === '');
  const disableSubmit = isSubmitting || areFieldsEmpty;

  const { isMobile } = useAppSelector(uiSelector);

  return (
    <form
      className={styles.loginFormWrapper}
      onSubmit={handleSubmit}
      noValidate
      method="POST"
    >
      {formError && !isSubmitting ? (
        <ErrorMessage message={formError} data-test-id="errorText" />
      ) : null}
      <ComposedField
        component={TextInput}
        name="email"
        label={formatMessage(messages.emailLabel)}
        autoFocus={!isMobile}
        type="email"
        autoComplete="email"
        containerClass={styles.inputContainer}
      />
      <ComposedField
        component={TextInput}
        name="password"
        label={formatMessage(messages.passwordLabel)}
        type="password"
        autoComplete="password"
        containerClass={styles.inputContainer}
        canShowPassword
      />
      <div className={styles.submitWrapper}>
        <Button
          name="submit"
          type="submit"
          appearance={disableSubmit ? 'tertiary' : 'primary'}
          disabled={disableSubmit}
          width="theme"
          loading={isSubmitting}
        >
          {formatMessage(messages.signInButtonLabel)}
        </Button>
      </div>
    </form>
  );
};

export const withFormikConfig: WithFormikConfig<LoginCredentialsFormProps, Required<FormValues>> = {
  mapPropsToValues(props) {
    return { email: props.email || '', password: '' };
  },
  validateOnChange: false,
  validateOnBlur: false,
  validate,
  handleSubmit,
};

const LoginCredentialsFormWithFormik = withFormik(withFormikConfig)(LoginCredentialsForm);

export const mapStateToProps = (state: StoreState): StateProps => {
  return {
    isCoppaEnabled: isCoppaEnabledSelector(state),
  };
};

export default connect(mapStateToProps)(injectIntl(LoginCredentialsFormWithFormik));

