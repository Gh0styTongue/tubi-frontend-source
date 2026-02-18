import classNames from 'classnames';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import type { MessageDataV2 } from 'common/features/playback/components/AdMessageWrapper/getMessageData';
import { inGroupCurrentAdTime, inGroupTotalAdTime } from 'common/features/playback/hooks/useAdPlayerUIRefresh';

import styles from './AdMessageV2.scss';

const messages = defineMessages({
  adMessageCurrentAd: {
    description: 'video ad message',
    defaultMessage: 'This ad will end in',
  },
  adMessageAllAd: {
    description: 'video ad message',
    defaultMessage: 'Your title will resume in',
  },
});

interface Props {
  className?: string;
  messageData?: MessageDataV2;
}

const AdMessage: React.FunctionComponent<Props> = (props) => {
  const { messageData } = props;

  if (!messageData) {
    return null;
  }

  const { adSequence, adCount, leftTime, refreshVariant, duration } = messageData;

  if (!duration) {
    return null;
  }

  let message = null;
  if (inGroupCurrentAdTime(refreshVariant)) {
    message = <FormattedMessage {...messages.adMessageCurrentAd} />;
  } else if (inGroupTotalAdTime(refreshVariant)) {
    message = <FormattedMessage {...messages.adMessageAllAd} />;
  }

  const dot = '. ';

  const countdownClassName = classNames(styles.adMessageCountdown, {
    [styles.adMessageCountdonwnShort]: !!message,
  });

  return (
    <div className={styles.adMessage}>
      {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
      <span>Ad {adSequence} of {adCount}</span>
      { message ? <span>{dot}{message}</span> : null }
      <span className={countdownClassName}>{leftTime}</span>
    </div>
  );
};

export default AdMessage;
