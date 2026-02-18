import { Button } from '@tubitv/web-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { defineMessages } from 'react-intl';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { toggleEnterPINModal, toggleEnterPasswordModal } from 'common/actions/ui';
import { validatePIN } from 'common/features/authentication/api/kidAccount';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { useIntl } from 'i18n/intl';
import type { PINInputRef } from 'web/features/authentication/components/PINInput/PINInput';
import PINInput from 'web/features/authentication/components/PINInput/PINInput';
import useDisableBodyScroll from 'web/hooks/useDisableBodyScroll';

import styles from './EnterPINModal.scss';

const messages = defineMessages({
  header: {
    description: 'Enter PIN modal header',
    defaultMessage: 'Enter your PIN to continue',
  },
  subheader: {
    description: 'Enter PIN modal subheader',
    defaultMessage: 'You must enter this PIN to exit Tubi Kids accounts.',
  },
  continueButton: {
    description: 'Continue button text',
    defaultMessage: 'Continue',
  },
  forgotPIN: {
    description: 'Forgot PIN link text',
    defaultMessage: 'Forgot your PIN?',
  },
  incorrectPIN: {
    description: 'Error message for incorrect PIN',
    defaultMessage: 'Incorrect PIN. Please try again.',
  },
  lockoutHeader: {
    description: 'Lockout state header',
    defaultMessage: 'Oops! Too Many Attempts',
  },
  lockoutBody: {
    description: 'Lockout state body',
    defaultMessage: 'Please try again in a bit.',
  },
  backToKidsHome: {
    description: 'Back to Kids Home button',
    defaultMessage: 'Back to Kids Home',
  },
});

const modalTransitions = {
  enter: styles.enter,
  enterActive: styles.enterActive,
  appear: styles.appear,
  appearActive: styles.appearActive,
  exit: styles.exit,
  exitActive: styles.exitActive,
  exitDone: styles.exitDone,
};

const EnterPINModal: React.FC = () => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const { formatMessage } = useIntl();
  const mainNodeRef = useRef<HTMLDivElement>(null);
  const pinInputRef = useRef<PINInputRef>(null);
  const dispatch = useAppDispatch();
  const modalProps = useAppSelector((state) => state.ui.enterPINModal);

  const { isVisible, onSuccess, onCancel } = modalProps;

  useDisableBodyScroll(isVisible);

  useEffect(() => {
    if (!isVisible) {
      setPin('');
      setError(false);
      setIsSubmitting(false);
      setIsLocked(false);
    }
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && !isLocked) {
      // setTimeout ensures focus happens after modal transition completes
      const timeoutId = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isVisible, isLocked]);

  const handlePINChange = useCallback((newValue: string) => {
    setPin(newValue);
    if (error) {
      setError(false);
    }
  }, [error]);

  const handleSubmit = useCallback(async () => {
    /* istanbul ignore if -- defensive check, button is disabled when condition is true */
    if (isSubmitting || pin.length !== 4) return;

    setIsSubmitting(true);
    setError(false);

    try {
      const { valid } = await dispatch(validatePIN(pin));
      if (valid) {
        dispatch(toggleEnterPINModal({ isVisible: false }));
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(true);
        setPin('');
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 429) {
        setIsLocked(true);
      } else {
        setError(true);
      }
      setPin('');
    } finally {
      setIsSubmitting(false);
    }
  }, [pin, isSubmitting, dispatch, onSuccess]);

  const handleForgotPIN = useCallback(() => {
    dispatch(toggleEnterPINModal({ isVisible: false }));
    dispatch(toggleEnterPasswordModal({
      isVisible: true,
      variant: 'resetPin',
      onSuccess: () => {
        dispatch(toggleEnterPINModal({
          isVisible: true,
          onSuccess,
          onCancel,
        }));
      },
    }));
  }, [dispatch, onSuccess, onCancel]);

  const handleClose = useCallback(() => {
    dispatch(toggleEnterPINModal({ isVisible: false }));
    if (onCancel) {
      onCancel();
    }
  }, [dispatch, onCancel]);

  const handleBackToKidsHome = useCallback(() => {
    dispatch(toggleEnterPINModal({ isVisible: false }));
    if (onCancel) {
      onCancel();
    }
  }, [dispatch, onCancel]);

  const renderLockedState = () => (
    <div className={styles.lockedContent}>
      <div className={styles.header}>{formatMessage(messages.lockoutHeader)}</div>
      <div className={styles.subheader}>{formatMessage(messages.lockoutBody)}</div>
      <Button
        size="medium"
        appearance="primary"
        className={styles.button}
        onClick={handleBackToKidsHome}
      >
        {formatMessage(messages.backToKidsHome)}
      </Button>
    </div>
  );

  const renderContent = () => (
    <div className={styles.content}>
      <div className={styles.header}>{formatMessage(messages.header)}</div>
      <div className={styles.subheader}>{formatMessage(messages.subheader)}</div>

      <div className={styles.pinInputWrapper}>
        <PINInput
          ref={pinInputRef}
          value={pin}
          onChange={handlePINChange}
          error={error}
          errorMessage={formatMessage(messages.incorrectPIN)}
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

      <button
        type="button"
        className={styles.forgotPINLink}
        onClick={handleForgotPIN}
      >
        {formatMessage(messages.forgotPIN)}
      </button>
    </div>
  );

  return (
    <TransitionGroup component="div">
      {isVisible ? (
        <CSSTransition classNames={modalTransitions} timeout={300} nodeRef={mainNodeRef}>
          <div ref={mainNodeRef} className={styles.main} data-nosnippet>
            <div className={styles.overlay} onClick={handleClose} role="presentation" />
            <div className={styles.modal}>
              {isLocked ? renderLockedState() : renderContent()}
            </div>
          </div>
        </CSSTransition>
      ) : null}
    </TransitionGroup>
  );
};

export default EnterPINModal;
