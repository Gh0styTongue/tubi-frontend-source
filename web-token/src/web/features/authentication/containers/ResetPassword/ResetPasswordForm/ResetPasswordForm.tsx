import { Shield } from '@tubitv/icons';
import { Button, ErrorMessage, TextInput } from '@tubitv/web-ui';
import { withFormik } from 'formik';
import type { FormikProps, FormikBag, WithFormikConfig } from 'formik';
import React from 'react';
import { injectIntl } from 'react-intl';
import type { IntlShape } from 'react-intl';

import { setPassword } from 'common/features/authentication/actions/pwdReset';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { checkIfKeysExist } from 'common/utils/collection';
import { validatePasswords } from 'common/utils/form';
import ComposedField from 'web/components/ComposedField/ComposedField';

import messages from './resetPasswordFormMessages';
import ContentWrapper from '../ContentWrapper/ContentWrapper';
import styles from '../ResetPassword.scss';
import Success from '../Success/Success';

export type FormValues = Record<'password' | 'password2', string>;

interface OwnProps {
  dispatch: TubiThunkDispatch;
  token: string;
  userId: string;
}

export interface ResetPasswordProps extends OwnProps {
  handleSubmit?: (event?: React.FormEvent<HTMLFormElement>) => void;
  intl: IntlShape;
  isSubmitting?: boolean;
  status?: {
    success?: boolean;
    formError?: string;
  };
}

export const ResetPasswordForm: React.FC<FormikProps<FormValues> & ResetPasswordProps> = ({
  handleSubmit,
  intl,
  isSubmitting,
  status = {},
  values,
}) => {
  const { formError, success } = status;
  if (success) return <Success />;

  const { formatMessage } = intl;
  const areFieldsEmpty = !checkIfKeysExist(values);
  const disableSubmit = isSubmitting || areFieldsEmpty;

  return (
    <ContentWrapper
      header={formatMessage(messages.title)}
      iconComponent={Shield}
    >
      <form className={styles.formContainer} onSubmit={handleSubmit} noValidate>
        {formError ? <ErrorMessage message={formError} /> : null}
        <ComposedField
          containerClass={styles.inputContainer}
          name="password"
          component={TextInput}
          type="password"
          label={formatMessage(messages.passwordLabel)}
          hint={formatMessage(messages.passwordHint)}
          canShowPassword
          autoFocus
        />
        <ComposedField
          name="password2"
          component={TextInput}
          type="password"
          label={formatMessage(messages.passwordLabel2)}
          hint={formatMessage(messages.passwordHint2)}
          canShowPassword
        />
        <Button
          type="submit"
          className={styles.submitButton}
          appearance={disableSubmit ? 'tertiary' : 'primary'}
          disabled={disableSubmit}
          width="theme"
        >
          {formatMessage(messages.submit)}
        </Button>
      </form>
    </ContentWrapper>
  );
};

export const handleSubmit = (data: FormValues, formikBag: FormikBag<ResetPasswordProps, FormValues>) => {
  const { setSubmitting, setStatus, props } = formikBag;
  const { token, userId, dispatch } = props;
  return dispatch(setPassword(token, data.password, userId))
    .then(() => {
      setSubmitting(false);
      setStatus({ success: true, formError: '' });
    })
    .catch(({ message: formError }: Error) => {
      setSubmitting(false);
      setStatus({ success: false, formError });
    });
};

export const withFormikConfig: WithFormikConfig<ResetPasswordProps, FormValues> = {
  mapPropsToValues: () => ({
    password: '',
    password2: '',
  }),
  validateOnChange: false,
  validateOnBlur: false,
  validate: validatePasswords,
  handleSubmit,
};

const ResetPasswordFormWithFormik = withFormik(withFormikConfig)(ResetPasswordForm);

export default injectIntl(ResetPasswordFormWithFormik);
