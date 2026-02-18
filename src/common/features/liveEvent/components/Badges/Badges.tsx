import { LiveFilled24 } from '@tubitv/icons';
import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useLiveEvent } from 'common/features/liveEvent/hooks/useLiveEvent';

import styles from './Badges.scss';

const messages = defineMessages({
  liveOn: {
    description: 'Live in time badge text, e.g Live in 1D',
    defaultMessage: 'Live in {time}',
  },
  starts: {
    description: 'Starts in date badge text, e.g STARTS NOV 27',
    defaultMessage: 'Starts {date}',
  },
  day: {
    description: 'Day badge text',
    defaultMessage: '{day}D',
  },
  hour: {
    description: 'Hour badge text',
    defaultMessage: '{hour}H',
  },
  minute: {
    description: 'Minute badge text',
    defaultMessage: '{minute}M',
  },
  live: {
    defaultMessage: 'Live',
    description: 'Live tag',
  },
});

interface LiveEventBadgesProps {
  id: string;
  size?: 'small' | 'normal',
}

export const LiveEventBadges: FC<LiveEventBadgesProps> =
  ({ id, size = 'normal' }) => {
    const liveEvent = useLiveEvent(id);
    const intl = useIntl();

    if (!liveEvent) {
      return null;
    }
    const { showLiveIcon, timeDiff, startTime } = liveEvent;
    const platformClass = {
      [styles.ott]: __ISOTT__,
      [styles.web]: __WEBPLATFORM__,
    };

    const badgeClass = classNames(styles.badge, platformClass, {
      [styles.small]: size === 'small',
    });

    if (showLiveIcon) {
      return <div className={classNames(platformClass, badgeClass, styles.live)}>
        <LiveFilled24 />
        {intl.formatMessage(messages.live)}
      </div>;
    }
    if (timeDiff) {
      let dateString = '';
      if (timeDiff.days > 5) {
        dateString = intl.formatMessage(messages.starts, {
          date: intl.formatDate(new Date(startTime), {
            month: 'short',
            day: 'numeric',
          }),
        });
      } else {
        if (timeDiff.days) {
          dateString = intl.formatMessage(messages.day, {
            day: timeDiff.days,
          });
        } else if (timeDiff.hours) {
          dateString = intl.formatMessage(messages.hour, {
            hour: timeDiff.hours,
          });
        } else {
          dateString = intl.formatMessage(messages.minute, {
            minute: timeDiff.minutes || 1,
          });
        }
        dateString = intl.formatMessage(messages.liveOn, {
          time: dateString,
        });
      }

      return (
        <div className={classNames(platformClass, badgeClass, styles.date)}>{dateString}</div>
      );
    }
    return null;
  };
