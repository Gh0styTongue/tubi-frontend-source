import classNames from 'classnames';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react';
import { defineMessages } from 'react-intl';

import { useIntl } from 'i18n/intl';

import styles from './PINInput.scss';

const messages = defineMessages({
  pinInputAriaLabel: {
    description: 'Aria label for PIN input field',
    defaultMessage: 'Enter 4-digit PIN',
  },
});

const MAX_PIN_LENGTH = 4;

export interface PINInputRef {
  focus: () => void;
}

interface PINInputProps {
  /**
   * Current PIN value (0-4 digits)
   * Controlled by parent component
   */
  value: string;

  /**
   * Callback fired when PIN value changes
   * @param newValue - The new PIN value (0-4 digits)
   */
  onChange: (newValue: string) => void;

  /**
   * Whether the component is in error state
   * When true, displays red borders and error message
   */
  error?: boolean;

  /**
   * Error message to display below the input
   * Only shown when error=true
   */
  errorMessage?: string;

  /**
   * Whether the input is disabled
   * Prevents all user interaction when true
   */
  disabled?: boolean;

  /**
   * Optional CSS class name for custom styling
   */
  className?: string;

  /**
   * Auto-focus the input on mount
   * Default: true
   */
  autoFocus?: boolean;

  /**
   * Callback fired when Enter key is pressed with a complete PIN
   */
  onSubmit?: () => void;
}

const PINInput = forwardRef<PINInputRef, PINInputProps>(({
  value,
  onChange,
  error = false,
  errorMessage,
  disabled = false,
  className,
  autoFocus = true,
  onSubmit,
}, ref) => {
  const { formatMessage } = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
  }));

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    // Filter to only numeric characters
    const numericValue = newValue.replace(/[^0-9]/g, '');

    // Enforce max length of 4 digits
    const truncatedValue = numericValue.slice(0, MAX_PIN_LENGTH);

    onChange(truncatedValue);
  }, [onChange]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (value.length === MAX_PIN_LENGTH && onSubmit) {
        onSubmit();
      }
      return;
    }

    // Handle backspace/delete
    if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      if (value.length > 0) {
        onChange(value.slice(0, -1));
      }
      return;
    }

    // Handle numeric keys (0-9)
    if (/^[0-9]$/.test(event.key)) {
      if (value.length >= MAX_PIN_LENGTH) {
        event.preventDefault();
      }
      return;
    }

    // Block all other keys except navigation keys
    if (!['Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
    }
  }, [value, onChange, onSubmit]);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();

    const pastedText = event.clipboardData.getData('text');
    const numericValue = pastedText.replace(/[^0-9]/g, '');
    const validValue = numericValue.slice(0, MAX_PIN_LENGTH);

    if (validValue.length > 0) {
      onChange(validValue);
    }
  }, [onChange]);

  const focusInput = useCallback(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const renderPINBoxes = () => {
    const boxes = [];
    const bullet = '•';
    for (let i = 0; i < MAX_PIN_LENGTH; i++) {
      const isFilled = value.length > i;
      boxes.push(
        <div
          key={i}
          className={classNames(styles.box, {
            [styles.error]: error,
          })}
          data-test-id={`pin-box-${i}`}
        >
          {isFilled && <span className={styles.dot}>{bullet}</span>}
        </div>
      );
    }
    return boxes;
  };

  return (
    <div className={classNames(styles.pinInput, className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={MAX_PIN_LENGTH}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        className={styles.hiddenInput}
        disabled={disabled}
        aria-label={formatMessage(messages.pinInputAriaLabel)}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error && errorMessage ? 'pin-error-message' : undefined}
        autoComplete="off"
      />

      <div
        className={styles.displayBoxes}
        onClick={focusInput}
        role="presentation"
      >
        {renderPINBoxes()}
      </div>

      {error && errorMessage && (
        <div
          id="pin-error-message"
          className={styles.errorMessage}
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </div>
      )}
    </div>
  );
});

PINInput.displayName = 'PINInput';

export default PINInput;
