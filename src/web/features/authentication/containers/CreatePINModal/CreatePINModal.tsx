import { Button } from '@tubitv/web-ui';
import React, { useCallback, useState, useEffect, useRef } from 'react';
import { defineMessages } from 'react-intl';

import { toggleCreatePINModal } from 'common/actions/ui';
import { createPIN } from 'common/features/authentication/api/kidAccount';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { useIntl } from 'i18n/intl';
import BaseModal from 'web/components/BaseModal/BaseModal';
import type { PINInputRef } from 'web/features/authentication/components/PINInput/PINInput';
import PINInput from 'web/features/authentication/components/PINInput/PINInput';

import styles from './CreatePINModal.scss';

const messages = defineMessages({
  createHeader: {
    description: 'Create PIN modal header',
    defaultMessage: 'Create New PIN',
  },
  confirmHeader: {
    description: 'Confirm PIN modal header',
    defaultMessage: 'Confirm New PIN',
  },
  subheader: {
    description: 'Create PIN modal subheader',
    defaultMessage: 'You must enter this PIN to exit Tubi Kids accounts.',
  },
  continueButton: {
    description: 'Continue button text',
    defaultMessage: 'Continue',
  },
  mismatchError: {
    description: 'Error message when PINs do not match',
    defaultMessage: 'PINs do not match. Please try again.',
  },
  rateLimitError: {
    description: 'Error message when too many attempts',
    defaultMessage: 'Too many attempts. Please try again later.',
  },
  genericError: {
    description: 'Generic error message for API failure',
    defaultMessage: 'Failed to create PIN. Please try again.',
  },
});

const CreatePINModal = () => {
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formatMessage } = useIntl();
  const dispatch = useAppDispatch();
  const modalProps = useAppSelector((state) => state.ui.createPINModal);
  const pinInputRef = useRef<PINInputRef>(null);

  const { isVisible, mode, createdPIN, password, onComplete } = modalProps;

  useEffect(() => {
    if (!isVisible) {
      setPin('');
      setErrorMessage('');
      setIsSubmitting(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible) {
      // setTimeout ensures focus happens after modal transition completes
      const timeoutId = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, mode]);

  const handlePINChange = useCallback((newValue: string) => {
    setPin(newValue);
    if (errorMessage) {
      setErrorMessage('');
    }
  }, [errorMessage]);

  const handleClose = useCallback(() => {
    dispatch(toggleCreatePINModal({ isVisible: false, mode: 'create' }));
  }, [dispatch]);

  const handleSubmit = useCallback(async () => {
    /* istanbul ignore if -- defensive check, button is disabled when condition is true */
    if (isSubmitting || pin.length !== 4) return;

    if (mode === 'create') {
      dispatch(toggleCreatePINModal({
        isVisible: true,
        mode: 'confirm',
        createdPIN: pin,
        password,
        onComplete,
      }));
      setPin('');
    } else {
      if (pin !== createdPIN) {
        setErrorMessage(formatMessage(messages.mismatchError));
        setPin('');
        return;
      }

      setIsSubmitting(true);
      try {
        await dispatch(createPIN({ pin, password: password || '' }));
        dispatch(toggleCreatePINModal({ isVisible: false, mode: 'create' }));
        if (onComplete) {
          onComplete();
        }
      } catch (err) {
        if (err && typeof err === 'object' && 'status' in err && err.status === 429) {
          setErrorMessage(formatMessage(messages.rateLimitError));
        } else {
          setErrorMessage(formatMessage(messages.genericError));
        }
        setPin('');
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [pin, mode, createdPIN, password, onComplete, dispatch, isSubmitting, formatMessage]);

  const header = mode === 'create'
    ? formatMessage(messages.createHeader)
    : formatMessage(messages.confirmHeader);

  return (
    <BaseModal isOpen={isVisible} onClose={handleClose} dataNoSnippet>
      <div className={styles.header}>{header}</div>
      <div className={styles.subheader}>{formatMessage(messages.subheader)}</div>

      <div className={styles.pinInputWrapper}>
        <PINInput
          ref={pinInputRef}
          value={pin}
          onChange={handlePINChange}
          error={!!errorMessage}
          errorMessage={errorMessage}
          disabled={isSubmitting}
          autoFocus
          onSubmit={handleSubmit}
        />
      </div>

      <Button
        size="medium"
        appearance={pin.length !== 4 || isSubmitting ? 'tertiary' : 'primary'}
        className={styles.button}
        onClick={handleSubmit}
        disabled={pin.length !== 4 || isSubmitting}
        loading={isSubmitting}
      >
        {formatMessage(messages.continueButton)}
      </Button>
    </BaseModal>
  );
};

export default CreatePINModal;
