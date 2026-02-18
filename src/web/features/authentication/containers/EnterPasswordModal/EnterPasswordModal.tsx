import { Button, TextInput } from '@tubitv/web-ui';
import React, { useCallback, useEffect, useState } from 'react';
import { defineMessages } from 'react-intl';

import { toggleCreatePINModal, toggleEnterPasswordModal } from 'common/actions/ui';
import { WEB_ROUTES } from 'common/constants/routes';
import { validateUserPassword } from 'common/features/authentication/actions/userList';
import { validatePassword } from 'common/features/authentication/api/kidAccount';
import { formatAccountName } from 'common/features/authentication/utils/auth';
import tubiHistory from 'common/history';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { firstNameSelector } from 'common/selectors/userSettings';
import type { EnterPasswordModalVariantA, EnterPasswordModalVariantB, UIState } from 'common/types/ui';
import { useIntl } from 'i18n/intl';
import BaseModal from 'web/components/BaseModal/BaseModal';

import styles from './EnterPasswordModal.scss';

const messages = defineMessages({
  // exitKids variant
  exitKidsHeader: {
    description: 'Enter password modal header with username for exit kids',
    defaultMessage: '{userName}, enter your password to exit Tubi Kids',
  },
  exitKidsSubheader: {
    description: 'Enter password modal subheader for exit kids',
    defaultMessage: 'For your security, please confirm your password.',
  },
  confirmChangesButton: {
    description: 'Confirm changes button text',
    defaultMessage: 'Confirm Changes',
  },
  // other variant
  resetPinHeader: {
    description: 'Enter password modal header for reset PIN',
    defaultMessage: 'Enter your password to reset your PIN',
  },
  editPinHeader: {
    description: 'Enter password modal header for edit PIN',
    defaultMessage: 'Enter your password to edit your PIN',
  },
  createPinHeader: {
    description: 'Enter password modal header for create PIN',
    defaultMessage: 'Enter your password to create your PIN',
  },
  startWatchingHeader: {
    description: 'Enter password modal header for start watching',
    defaultMessage: '{userName}, enter your password to start watching',
  },
  startWatchingSubheader: {
    description: 'Enter password modal subheader for start watching',
    defaultMessage: "You're locked in Kids Mode for 24 hours. To switch accounts, enter your password.",
  },
  editContentSettingsHeader: {
    description: 'Enter password modal header for editing content settings',
    defaultMessage: '{userName}, enter your password in order to save your content setting.',
  },
  editContentSettingsKidsHeader: {
    description: 'Enter password modal header for editing content settings kids',
    defaultMessage: '{userName}, enter your password to confirm your changes',
  },
  continueButton: {
    description: 'Continue button text',
    defaultMessage: 'Continue',
  },
  // Common
  passwordLabel: {
    description: 'Password input label',
    defaultMessage: 'Password',
  },
  forgotPassword: {
    description: 'Forgot password link text',
    defaultMessage: 'Forgot your password?',
  },
  incorrectPassword: {
    description: 'Error message for incorrect password',
    defaultMessage: 'Incorrect password. Please try again.',
  },
  rateLimitError: {
    description: 'Error message when too many attempts',
    defaultMessage: 'Too many attempts. Please try again later.',
  },
  genericError: {
    description: 'Generic error message',
    defaultMessage: 'Something went wrong. Please try again.',
  },
});

function checkIsExitKidsVariant(props: UIState['enterPasswordModal']): props is EnterPasswordModalVariantA {
  return props.variant === undefined || props.variant === 'exitKids';
}
function checkIsResetPinVariant(props: UIState['enterPasswordModal']): props is EnterPasswordModalVariantA {
  const { variant } = props;
  return variant === 'resetPin' || variant === 'editPin' || variant === 'createPin';
}
function checkIsStartWatchingVariant(props: UIState['enterPasswordModal']): props is EnterPasswordModalVariantB {
  return props.variant === 'startWatching';
}
function checkIsEditContentSettingsVariant(props: UIState['enterPasswordModal']): props is EnterPasswordModalVariantA {
  return props.variant === 'editContentSettings';
}
function checkIsEditContentSettingsKidVariant(props: UIState['enterPasswordModal']): props is EnterPasswordModalVariantB {
  return props.variant === 'editContentSettingsKid';
}

const EnterPasswordModal = () => {
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formatMessage } = useIntl();
  const currentUserName = useAppSelector(firstNameSelector);
  const dispatch = useAppDispatch();
  const modalProps = useAppSelector((state) => state.ui.enterPasswordModal);

  const { isVisible, onSuccess } = modalProps;
  const isExitKidsVariant = checkIsExitKidsVariant(modalProps);
  const isResetPinVariant = checkIsResetPinVariant(modalProps);
  const isStartWatchingVariant = checkIsStartWatchingVariant(modalProps);
  const isEditContentSettingsVariant = checkIsEditContentSettingsVariant(modalProps);
  const isEditContentSettingsKidVariant = checkIsEditContentSettingsKidVariant(modalProps);

  const requiresTargetUserValidation = isStartWatchingVariant || isEditContentSettingsKidVariant;

  useEffect(() => {
    if (!isVisible) {
      setPassword('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isVisible]);

  const handlePasswordChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (errorMessage) {
      setErrorMessage('');
    }
  }, [errorMessage]);

  const handleSubmit = useCallback(async () => {
    /* istanbul ignore if -- defensive check, button is disabled when condition is true */
    if (isSubmitting || !password) return;

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { valid } = await (requiresTargetUserValidation ? dispatch(validateUserPassword(modalProps.targetUser, password)) : dispatch(validatePassword(password)));
      if (valid) {
        dispatch(toggleEnterPasswordModal({ isVisible: false }));

        if (isResetPinVariant) {
          dispatch(toggleCreatePINModal({
            isVisible: true,
            mode: 'create',
            password,
            onComplete: onSuccess,
          }));
        } else if (onSuccess) {
          onSuccess(password);
        }
      } else {
        setErrorMessage(formatMessage(messages.incorrectPassword));
        setPassword('');
      }
    } catch (err) {
      if ((err as { status?: number })?.status === 429) {
        setErrorMessage(formatMessage(messages.rateLimitError));
      } else {
        setErrorMessage(formatMessage(messages.genericError));
      }
      setPassword('');
    } finally {
      setIsSubmitting(false);
    }
  }, [password, isSubmitting, requiresTargetUserValidation, dispatch, modalProps.targetUser, isResetPinVariant, onSuccess, formatMessage]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && password && !isSubmitting) {
      event.preventDefault();
      void handleSubmit();
    }
  }, [password, isSubmitting, handleSubmit]);

  const handleForgotPassword = useCallback(() => {
    dispatch(toggleEnterPasswordModal({ isVisible: false }));
    tubiHistory.push(WEB_ROUTES.forgotPassword);
  }, [dispatch]);

  const handleClose = useCallback(() => {
    dispatch(toggleEnterPasswordModal({ isVisible: false }));
  }, [dispatch]);

  const getHeaderText = () => {
    switch (modalProps.variant) {
      case 'resetPin':
        return formatMessage(messages.resetPinHeader);
      case 'editPin':
        return formatMessage(messages.editPinHeader);
      case 'createPin':
        return formatMessage(messages.createPinHeader);
      case 'startWatching':
        return formatMessage(messages.startWatchingHeader, { userName: formatAccountName(modalProps.targetUser.name) });
      case 'editContentSettings':
        return formatMessage(messages.editContentSettingsHeader, { userName: formatAccountName(currentUserName) });
      case 'editContentSettingsKid':
        return formatMessage(messages.editContentSettingsKidsHeader, { userName: formatAccountName(modalProps.targetUser.name) });
      case 'exitKids':
      default:
        return formatMessage(messages.exitKidsHeader, { userName: formatAccountName(currentUserName) });
    }
  };
  const headerText = getHeaderText();

  const getSubHeaderText = () => {
    switch (modalProps.variant) {
      case 'exitKids':
      case undefined:
        return formatMessage(messages.exitKidsSubheader);
      case 'startWatching':
        return formatMessage(messages.startWatchingSubheader);
      case 'editContentSettingsKid':
        return formatMessage(messages.exitKidsSubheader);
      default:
        return '';
    }
  };
  const subHeaderText = getSubHeaderText();

  const buttonText = isExitKidsVariant
    ? formatMessage(messages.confirmChangesButton)
    : formatMessage(messages.continueButton);

  const useExitKidsStyle = isExitKidsVariant || isEditContentSettingsVariant || isEditContentSettingsKidVariant;

  return (
    <BaseModal
      isOpen={isVisible}
      onClose={handleClose}
      modalContainerClassName={useExitKidsStyle ? styles.exitKidsModal : undefined}
      dataNoSnippet
    >
      <div className={styles.header}>{headerText}</div>
      {!!subHeaderText && <div className={styles.subheader}>{subHeaderText}</div>}

      <div className={styles.passwordInputWrapper}>
        <TextInput
          name="password"
          label={formatMessage(messages.passwordLabel)}
          type="password"
          value={password}
          onChange={handlePasswordChange}
          onKeyDown={handleKeyDown}
          error={errorMessage}
          autoComplete="current-password"
          canShowPassword
          disabled={isSubmitting}
          autoFocus
        />
      </div>

      <Button
        size="medium"
        appearance={!password || isSubmitting ? 'tertiary' : 'primary'}
        className={styles.button}
        onClick={handleSubmit}
        disabled={!password || isSubmitting}
        loading={isSubmitting}
      >
        {buttonText}
      </Button>

      <button type="button" className={styles.forgotPasswordLink} onClick={handleForgotPassword}>
        {formatMessage(messages.forgotPassword)}
      </button>
    </BaseModal>
  );
};

export default EnterPasswordModal;
