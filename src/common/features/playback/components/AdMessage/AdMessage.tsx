import { Countdown } from '@tubitv/ott-ui';
import classNames from 'classnames';
import React from 'react';
import { defineMessages, FormattedMessage } from 'react-intl';

import type { MessageData } from 'common/features/playback/components/AdMessageWrapper/getMessageData';
import CircularProgressBar from 'common/features/playback/components/CircularProgressBar/CircularProgressBar';

import styles from './AdMessage.scss';

export const messages = defineMessages({
  adMessage: {
    description: 'video ad message',
    defaultMessage: 'Your video will resume after the break',
  },
  adMessageCurrentAd: {
    description: 'video ad message',
    defaultMessage: '{leftTime} seconds left in this ad',
  },
  adMessageAllAd: {
    description: 'video ad message',
    defaultMessage: 'Your title will resume in {leftTime}',
  },
});

export enum AD_MESSAGE_STYLE {
  LEGACY = 0,
  AD_PROGRESS_OF_ALL_ADS = 1,
  AD_PROGRESS_OF_CURRENT_AD = 2,
}

interface Props {
  className?: string;
  progress: number;
  showProgressBar: boolean;
  messageData?: MessageData;
}

const getAdDetailMessage = (messageData?: MessageData) => {
  if (!messageData) return null;

  const { messageStyle, adSequence, adCount, leftTime } = messageData;
  if (messageStyle === AD_MESSAGE_STYLE.LEGACY) {
    return (
      <div className={styles.adMessageText}>
        <FormattedMessage {...messages.adMessage} />
      </div>
    );
  }
  const formattedMessage = messageStyle === AD_MESSAGE_STYLE.AD_PROGRESS_OF_CURRENT_AD
    ? messages.adMessageCurrentAd
    : messages.adMessageAllAd;
  return (
    <div className={styles.adMessageText}>
      {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
      <span className={styles.adMessageSequence}> {adSequence} / {adCount} </span>
      {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
      <span className={styles.adMessageDot}>·</span>
      <FormattedMessage {...formattedMessage} values={{ leftTime }} />
    </div>
  );
};

const AdMessage: React.FunctionComponent<Props> = (props) => {
  const { progress, showProgressBar, messageData } = props;

  const rootClassName = classNames(styles.adMessage, props.className);

  // todo: not ready for i18n yet.
  const adText = 'AD';

  // this pattern will exclude or include the target component during webpack optimization, so don't worry about bundling unwanted codes.
  let progressBar;
  if (__ISOTT__) {
    progressBar = (
      <Countdown
        direction="clockwise"
        progress={progress}
        showProgressBar={showProgressBar}
        type="text"
      >
        {adText}
      </Countdown>
    );
  } else {
    progressBar = showProgressBar ? (
      <CircularProgressBar innerText={adText} progress={progress} />
    ) : (
      <div className={styles.adMessageProgressBar}>{adText}</div>
    );
  }

  const adDetailMessage = getAdDetailMessage(messageData);

  return (
    <div className={rootClassName}>
      {progressBar}
      {adDetailMessage}
    </div>
  );
};

export default AdMessage;
