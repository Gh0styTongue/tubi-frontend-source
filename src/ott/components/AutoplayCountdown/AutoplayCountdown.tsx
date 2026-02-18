import classnames from 'classnames';
import type { FC } from 'react';
import React, { useEffect, useState } from 'react';
import { defineMessages } from 'react-intl';

import { useIntl } from 'i18n/intl';

import styles from './AutoplayCountdown.scss';

const messages = defineMessages({
  fullscreenIn: {
    description: 'Text shown before countdown number for fullscreen autoplay',
    defaultMessage: 'Fullscreen In',
  },
});

interface Props {
  seconds: number;
  className?: string;
  onComplete?: () => void;
}

export const AutoplayCountdown: FC<Props> = ({ seconds, className, onComplete }) => {
  const intl = useIntl();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Fade in animation after mount (0.3s delay)
    const timer = setTimeout(() => {
      setVisible(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (seconds <= 0 && onComplete) {
      onComplete();
    }
  }, [seconds, onComplete]);

  if (seconds <= 0) {
    return null;
  }

  return (
    <div
      className={classnames(
        styles.autoplayCountdown,
        {
          [styles.visible]: visible,
        },
        className
      )}
    >
      <span className={styles.text}>
        {intl.formatMessage(messages.fullscreenIn)}
      </span>
      <div className={styles.numberContainer}>
        <svg
          className={styles.progressRing}
          width="40"
          height="40"
          viewBox="0 0 40 40"
        >
          <circle
            className={styles.progressRingCircle}
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            r="19"
            cx="20"
            cy="20"
          />
        </svg>
        <span className={styles.number}>{seconds}</span>
      </div>
    </div>
  );
};

