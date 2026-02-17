import { Channel } from '@tubitv/analytics/lib/genericEvents';
import { SocialFacebook, SocialTwitter } from '@tubitv/icons';
import classNames from 'classnames';
import React, { memo } from 'react';
import { defineMessages } from 'react-intl';

import { addUtmParams } from 'common/utils/track';
import { useIntl } from 'i18n/intl';

import styles from './ShareButtons.scss';

interface Props {
  className?: string;
  onIconClick?: (social: Channel) => void;
  shareUrl: string;
  title: string;
}

const getShareInfo = ({ shareUrl, twitterText }: { shareUrl: string; twitterText: string }) => [
  {
    name: 'twitter',
    Icon: SocialTwitter,
    trackType: Channel.TWITTER,
    url: `https://twitter.com/intent/tweet?text=${twitterText} ${addUtmParams(shareUrl, 'twitter')}`,
  },
  {
    name: 'facebook',
    Icon: SocialFacebook,
    trackType: Channel.FACEBOOK,
    url: `https://www.facebook.com/sharer/sharer.php?u=${addUtmParams(shareUrl, 'facebook')}`,
  },
];

const messages = defineMessages({
  twitterText: {
    description: 'social share message',
    defaultMessage: 'Watch {title} on Tubi:',
  },
});

const ShareButtons = ({ className, onIconClick, shareUrl, title }: Props) => {
  const { formatMessage } = useIntl();

  const twitterText = formatMessage(messages.twitterText, { title });
  const shareInfo = getShareInfo({ shareUrl, twitterText });

  const handleShareClick = (trackType: Channel) => {
    if (onIconClick) {
      onIconClick(trackType);
    }
  };

  return (
    <span className={classNames(styles.root, className)}>
      {shareInfo.map(({ Icon, url, trackType, name }) => (
        <a key={name} href={url} target="_blank" onClick={() => handleShareClick(trackType)}>
          <Icon />
        </a>
      ))}
    </span>
  );
};

export default memo(ShareButtons);
