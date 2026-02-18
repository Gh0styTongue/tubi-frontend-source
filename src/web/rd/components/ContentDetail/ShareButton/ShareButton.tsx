import type { Channel } from '@tubitv/analytics/lib/genericEvents';
import { Action } from '@tubitv/analytics/lib/genericEvents';
import { SocialFacebook, SocialTwitter, ShareIos } from '@tubitv/icons';
import { Button, useBreakpointIfAvailable, useOnClickOutside } from '@tubitv/web-ui';
import classnames from 'classnames';
import type { FC } from 'react';
import React, { useCallback, useRef, useState } from 'react';
import { defineMessages } from 'react-intl';

import { WEB_HOSTNAME } from 'common/constants/constants';
import {
  SOCIAL_SHARE_EVENT,
  SOCIAL_SHARE_FACEBOOK,
  SOCIAL_SHARE_TWITTER,
} from 'common/constants/event-types';
import { ContentDetailPageNavOption } from 'common/types/ottUI';
import type { VideoType } from 'common/types/video';
import { buildSocialShareEventObject } from 'common/utils/analytics';
import { addUtmParams, trackEvent } from 'common/utils/track';
import { getUrl } from 'common/utils/urlConstruction';
import { useIntl } from 'i18n/intl';
import { trackContentDetailNavComponentInteractionEvent } from 'ott/utils/contentDetailNav';

import styles from './ShareButton.scss';

export const messages = defineMessages({
  share: {
    description: 'text for share button',
    defaultMessage: 'Share',
  },
  twitterText: {
    description: 'social share message', // context for translators
    defaultMessage: 'Watch {title} on Tubi:',
  },
});

const getShareInfo = ({
  shareUrl,
  twitterText,
}: {
  shareUrl: string;
  twitterText: string;
}) => [
  {
    name: 'facebook',
    Icon: SocialFacebook,
    trackType: SOCIAL_SHARE_FACEBOOK,
    url: `https://www.facebook.com/sharer/sharer.php?u=${addUtmParams(
      shareUrl,
      'facebook'
    )}`,
  },
  {
    name: 'twitter',
    Icon: SocialTwitter,
    trackType: SOCIAL_SHARE_TWITTER,
    url: `https://twitter.com/intent/tweet?text=${twitterText} ${addUtmParams(
      shareUrl,
      'twitter'
    )}`,
  },
];

export interface ShareButtonProps {
  title: string;
  contentId: string;
  type: VideoType;
  isNewDesign?: boolean;
}

type ShareInfoProps = {
  name: string;
  Icon: typeof SocialFacebook | typeof SocialTwitter;
  trackType: string;
  url: string;
  handleShareClick: (channel: Channel) => void;
};

const ShareInfo: FC<ShareInfoProps> = (info) => {

  const { handleShareClick, trackType, name, url, Icon } = info;

  const onClick = useCallback(() => {
    handleShareClick(trackType as Channel);
  }, [handleShareClick, trackType]);

  return <a
    className={styles.option}
    key={name}
    href={url}
    target="_blank"
    onClick={onClick}
  >
    {name}
    <span className={styles.shareIcons}>
      <Icon />
    </span>
  </a>;
};

const ShareButton: FC<ShareButtonProps> = ({ title, contentId, type, isNewDesign = false }) => {
  const intl = useIntl();
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOnClickOutside(ref, () => setShow(false));

  const shareUrl = getUrl({ type, id: contentId, title, host: WEB_HOSTNAME });

  const twitterText = intl.formatMessage(messages.twitterText, { title });

  const shareInfo = getShareInfo({ shareUrl, twitterText });

  const handleShareClick = useCallback((trackType: Channel) => {
    const socialShareEventBody = buildSocialShareEventObject(
      contentId,
      trackType,
      Action.CLICK
    );
    trackEvent(SOCIAL_SHARE_EVENT, socialShareEventBody);
    trackContentDetailNavComponentInteractionEvent({ componentSectionIndex: ContentDetailPageNavOption.Share });
    setShow(false);
  }, [contentId]);

  const bp = useBreakpointIfAvailable();
  let responsiveMode = 'text';
  if (isNewDesign) {
    responsiveMode = bp?.xl ? 'text' : 'tooltip';
  }

  const onClick = useCallback(() => setShow(show => !show), []);

  return (
    <div className={styles.share} ref={ref}>
      <Button
        className={styles.button}
        appearance="tertiary"
        onClick={onClick}
        tooltip={responsiveMode === 'tooltip' ? intl.formatMessage(messages.share) : undefined}
        icon={isNewDesign ? ShareIos : undefined}
        iconSize="large"
      >
        {responsiveMode === 'text' ? intl.formatMessage(messages.share) : null}
      </Button>
      {show ? (
        <div className={classnames(styles.menu)}>
          <div className={classnames(styles.options)}>
            {shareInfo.map(info => (
              <ShareInfo
                key={info.name}
                Icon={info.Icon}
                url={info.url}
                name={info.name}
                trackType={info.trackType}
                handleShareClick={handleShareClick}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ShareButton;
