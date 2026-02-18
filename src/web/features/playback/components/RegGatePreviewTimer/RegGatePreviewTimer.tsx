import classNames from 'classnames';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { VIDEO_REG_GATE_TIME_THRESHOLD } from 'common/constants/player';

import styles from './RegGatePreviewTimer.scss';

const messages = defineMessages({
  signUpFreeUnlimited: {
    description: 'sign up for free unlimited streaming text',
    defaultMessage: 'Sign up for free, unlimited streaming',
  },
  preview: {
    description: 'preview label',
    defaultMessage: 'Preview',
  },
});

// eslint-disable-next-line import/no-unused-modules
export interface RegGatePreviewTimerProps {
  position: number;
  active: boolean;
  showText?: boolean;
  customClassName?: string;
}

const RegGatePreviewTimer: React.FC<RegGatePreviewTimerProps> = ({ position, active, showText = true, customClassName }) => {
  const { formatMessage } = useIntl();
  // Calculate remaining time
  const remainingSeconds = Math.max(0, VIDEO_REG_GATE_TIME_THRESHOLD - position);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = Math.floor(remainingSeconds % 60);
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const previewTimerClasses = classNames(styles.previewTimer, customClassName, {
    [styles.previewTimerActive]: active,
  });

  return (
    <div className={previewTimerClasses}>
      {showText && (
        <span className={styles.previewTimerText}>
          {formatMessage(messages.signUpFreeUnlimited)}
        </span>
      )}
      <span className={styles.previewTimerCountdown}>
        {formatMessage(messages.preview)} {formattedTime}
      </span>
    </div>
  );
};

export default RegGatePreviewTimer;

