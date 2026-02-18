import { ShareIos } from '@tubitv/icons';
import { Button, useOnClickOutside } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useRef, useState, memo } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { CONTAINER_TYPES, WEB_HOSTNAME } from 'common/constants/constants';
import { getContainerUrl } from 'common/utils/urlConstruction';
import ShareButtons from 'web/rd/components/ShareButtons/ShareButtons';

import styles from './ChannelDetails.scss';

export interface ChannelDetailsProps {
  title: string;
  description: string;
  logo: string;
  channelId: string;
}

export const messages = defineMessages({
  title: {
    description: 'Share Menu title',
    defaultMessage: 'The {title} Channel',
  },
  share: {
    description: 'Share Menu text',
    defaultMessage: 'Share',
  },
});

const ChannelDetails: FC<ChannelDetailsProps> = ({ logo, description, title, channelId }) => {
  const intl = useIntl();
  const shareRef = useRef<HTMLDivElement>(null);
  const channelUrl = `${WEB_HOSTNAME}${getContainerUrl(channelId, {
    type: CONTAINER_TYPES.CHANNEL,
  })}`;
  const [shareOpened, setShareOpened] = useState(false);
  const onIconClick = useCallback(() => setShareOpened(false), []);
  const onClick = useCallback(() => setShareOpened(true), []);
  useOnClickOutside(shareRef, onIconClick);
  return (
    <div className={styles.channelDetails}>
      <img className={styles.logo} src={logo} alt={`${title} logo`} />
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.description}>{description}</div>
      <div className={styles.share} ref={shareRef}>
        <Button
          className={styles.shareMenuButton}
          appearance="tertiary"
          icon={ShareIos}
          onClick={onClick}
          iconSize="large"
        />
        <div
          className={classnames(styles.shareMenu, {
            [styles.show]: shareOpened,
          })}
        >
          {intl.formatMessage(messages.share)}
          <ShareButtons
            onIconClick={onIconClick}
            shareUrl={channelUrl}
            title={title}
          />
        </div>
      </div>
    </div>
  );
};

export default memo(ChannelDetails);
