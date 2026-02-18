import { toCSSUrl } from '@adrise/utils/lib/url';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import styles from '../FloatingPlayerOverlay.scss';
import useRemainingPlaybackTime from '../hooks/useRemainingPlaybackTime';

const messages = defineMessages({
  timeLeft: {
    description: 'The remaining time of the content, for example "1h 3m left"',
    defaultMessage: '{time} left',
  },
});

interface TitleAreaProps {
  logoImg: string | undefined;
  title: string;
  duration: number;
}

function TitleArea({ logoImg, title, duration }: TitleAreaProps) {
  const remainingTime = useRemainingPlaybackTime({ duration });

  return (
    <div className={styles.titleArea}>
      {logoImg && (
        <div className={styles.logo}>
          <div style={{ backgroundImage: toCSSUrl(logoImg) }} />
        </div>
      )}
      <div>
        <h3>{title}</h3>
        <p><FormattedMessage {...messages.timeLeft} values={{ time: remainingTime }} /></p>
      </div>
    </div>
  );
}

export default TitleArea;
