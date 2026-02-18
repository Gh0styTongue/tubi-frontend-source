import { Button, ErrorMessage, TextInput } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import ComposedField from 'web/components/ComposedField/ComposedField';
import NoPassword from 'web/components/NoPassword/NoPassword';

import styles from './ChangePasswordForm.scss';

export const messages = defineMessages({
  changePassword: {
    description: 'change password heading text',
    defaultMessage: 'Change Password',
  },
  defaultLabel: {
    description: 'submit form button text',
    defaultMessage: 'Submit',
  },
  email: {
    description: 'email form field label',
    defaultMessage: 'Email',
  },
  password: {
    description: 'password form field label',
    defaultMessage: 'Current Password',
  },
  passwordHint: {
    description: 'password form field placeholder text',
    defaultMessage: 'Input your current password',
  },
  newPassword: {
    description: 'password form field label',
    defaultMessage: 'New Password',
  },
  newPasswordHint: {
    description: 'password form field placeholder text',
    defaultMessage: 'Pick something you can remember',
  },
  confirmPassword: {
    description: 'password form field label',
    defaultMessage: 'Confirm Password',
  },
  confirmPasswordHint: {
    description: 'password form field placeholder text',
    defaultMessage: 'Re-enter your password',
  },
  errorSummary: {
    description: 'error summary text',
    defaultMessage: 'Please fix the following errors:',
  },
});

export interface ChangePasswordFormProps {
  autoFocus?: boolean;
  className?: string;
  currentPassword: string;
  email?: string;
  formError?: string;
  hasPassword?: boolean;
  isSubmitting?: boolean;
  newPassword: string;
  newPassword2: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitLabel?: string;
}

/**
 * component used to render a form for resetting password.
 */
const ChangePasswordForm: React.FunctionComponent<ChangePasswordFormProps> = ({
  autoFocus,
  className,
  currentPassword,
  email,
  formError,
  hasPassword,
  isSubmitting,
  newPassword,
  newPassword2,
  onSubmit,
  submitLabel,
}) => {
  const { formatMessage } = useIntl();
  const formClass = classNames(styles.formContainer, className);
  const buttonClass = classNames(styles.submitButton, className);
  const hasEmptyFields = !currentPassword || !newPassword || !newPassword2;
  const disableSubmit = isSubmitting || hasEmptyFields;
  const [errorSummary, setErrorSummary] = useState<string[]>([]);

  // Get error summary for top-level display
  const getErrorSummary = () => {
    const fieldNames = ['currentPassword', 'newPassword', 'newPassword2'];
    const errors: string[] = [];

    fieldNames.forEach(fieldName => {
      const input = document.querySelector(`input[name="${fieldName}"]`) as HTMLInputElement;
      if (input && input.getAttribute('aria-invalid')) {
        const errorElement = document.getElementById(`error-text-input-${fieldName}`);
        if (errorElement && errorElement.textContent) {
          errors.push(errorElement.textContent.trim());
        }
      }
    });

    setErrorSummary(errors);
  };

  const handleFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    // Call the original onSubmit first
    if (onSubmit) {
      onSubmit(e);
    }

    // Clear previous errors and update after a brief delay to avoid interruption
    setErrorSummary([]);
    setTimeout(() => {
      getErrorSummary();
    }, 100);
  }, [onSubmit]);

  if (!hasPassword) {
    return (
      <NoPassword
        textClassName={styles.noPasswordText}
        useRefreshStyle
      />
    );
  }

  return (
    <form className={formClass} onSubmit={handleFormSubmit} noValidate>
      <ErrorMessage message={formError} />
      {errorSummary.length > 0 && (
        <div role="alert" aria-live="assertive" aria-atomic="true" className={styles.srOnly}>
          <h3>{formatMessage(messages.errorSummary)}</h3>
          <ol>
            {errorSummary.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ol>
        </div>
      )}
      <fieldset>
        <legend className="sr-only">{formatMessage(messages.changePassword)}</legend>
        {email ? (
          <ComposedField
            component={TextInput}
            containerClass={styles.input}
            disabled
            label={formatMessage(messages.email)}
            name=""
            type="email"
            value={email}
          />
        ) : null}
        <ComposedField
          autoFocus={autoFocus}
          canShowPassword
          component={TextInput}
          containerClass={styles.input}
          hint={formatMessage(messages.passwordHint)}
          label={formatMessage(messages.password)}
          name="currentPassword"
          type="password"
        />
        <ComposedField
          canShowPassword
          component={TextInput}
          containerClass={styles.input}
          hint={formatMessage(messages.newPasswordHint)}
          label={formatMessage(messages.newPassword)}
          name="newPassword"
          type="password"
        />
        <ComposedField
          canShowPassword
          component={TextInput}
          containerClass={styles.input}
          hint={formatMessage(messages.confirmPasswordHint)}
          label={formatMessage(messages.confirmPassword)}
          name="newPassword2"
          type="password"
        />
      </fieldset>
      <Button
        className={buttonClass}
        type="submit"
        appearance={disableSubmit ? 'tertiary' : 'primary'}
        disabled={disableSubmit}
        loading={isSubmitting}
      >
        {submitLabel || formatMessage(messages.defaultLabel)}
      </Button>
    </form>
  );
};

export default ChangePasswordForm;
