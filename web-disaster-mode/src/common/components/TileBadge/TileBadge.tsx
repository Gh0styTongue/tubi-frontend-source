import { LiveFilled24 } from '@tubitv/icons';
import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { defineMessages } from 'react-intl';

import { useIntl } from 'i18n/intl';

import styles from './TileBadge.scss';

interface Props {
  type: 'live' | 'on-now' | 'language' | 'early-access' | 'top-10' | 'full-hd';
  language?: string;
  vibe?: string;
  className?: string;
}

const messages = defineMessages({
  live: {
    defaultMessage: 'Live',
    description: 'Live tag',
  },
  onNow: {
    defaultMessage: 'On Now',
    description: 'On Now tag',
  },
  earlyAccess: {
    defaultMessage: 'Watch Early',
    description: 'Early Access tag',
  },
  top10: {
    defaultMessage: 'Top 10',
    description: 'Top 10 tag',
  },
  fullHD: {
    defaultMessage: 'Full HD',
    description: 'Full HD tag',
  },
});

const BadgeContents: FC<Pick<Props, 'type' | 'language' | 'vibe'>> = ({ type, language, vibe }) => {
  const intl = useIntl();
  switch (type) {
    case 'live':
      return (
        <>
          <LiveFilled24 />
          {intl.formatMessage(messages.live)}
        </>
      );
    case 'full-hd':
      return <>{intl.formatMessage(messages.fullHD)}</>;
    case 'on-now':
      return <>{intl.formatMessage(messages.onNow)}</>;
    case 'early-access':
      return <>{intl.formatMessage(messages.earlyAccess)}</>;
    case 'language':
      return <>{language}</>;
    case 'top-10':
      return <>{vibe ?? intl.formatMessage(messages.top10)}</>;
    /* istanbul ignore next -- this should never happen. only included to satisfy eslint */
    default:
      return null;
  }
};

const TileBadge: FC<Props> = ({ type, className, language, vibe }) => (
  <div
    data-test-id="tile-badge"
    className={classNames(
      styles.tag,
      {
        [styles.web]: !__ISOTT__,
        [styles.live]: type === 'live',
        [styles.onNow]: type === 'on-now',
        [styles.fullHD]: type === 'full-hd',
        [styles.earlyAccess]: type === 'early-access',
        [styles.language]: type === 'language',
        [styles.top10]: type === 'top-10',
      },
      className
    )}
  >
    <BadgeContents type={type} language={language} vibe={vibe} />
  </div>
);

export default TileBadge;
