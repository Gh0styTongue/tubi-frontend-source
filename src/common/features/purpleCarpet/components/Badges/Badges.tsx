import { toAMOrPM } from '@adrise/utils/lib/time';
import { LiveFilled24 } from '@tubitv/icons';
import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { usePurpleCarpet } from 'common/features/purpleCarpet/hooks/usePurpleCarpet';
import { isSupport4K } from 'common/features/purpleCarpet/selector';
import useAppSelector from 'common/hooks/useAppSelector';

import styles from './Badges.scss';

const messages = defineMessages({
  liveOn: {
    description: 'Live on date badge text',
    defaultMessage: 'Live on {date}',
  },
  day: {
    description: 'Day badge text',
    defaultMessage: '{day} D',
  },
  hour: {
    description: 'Hour badge text',
    defaultMessage: '{hour} HR',
  },
  minute: {
    description: 'Minute badge text',
    defaultMessage: '{minute} MIN',
  },
  today: {
    description: 'Today date badge text',
    defaultMessage: 'Today at {time}',
  },
  live: {
    defaultMessage: 'Live',
    description: 'Live tag',
  },
});

export interface PurpleCarpetBadgesProps {
  id: string;
  displayTimer?: boolean;
  size?: 'small' | 'normal',
  display4K?: boolean
}

export const PurpleCarpetBadges: FC<PurpleCarpetBadgesProps> =
  ({ id, displayTimer = true, size = 'normal', display4K }) => {
    const { current } = usePurpleCarpet(id);
    const intl = useIntl();
    const support4K = useAppSelector((state) => isSupport4K(state, id));

    if (!current) {
      return null;
    }
    const { showLiveIcon, timeDiff, startTime, isToday } = current;
    const platformClass = {
      [styles.ott]: __ISOTT__,
      [styles.web]: __WEBPLATFORM__,
    };

    const badgeClass = classNames(styles.badge, platformClass, {
      [styles.small]: size === 'small',
    });

    const liveIcon = <div className={classNames(styles.badges, platformClass)}>
      <div className={classNames(badgeClass, styles.live)}>
        <LiveFilled24 />
        {intl.formatMessage(messages.live)}
      </div>
    </div>;

    // eslint-disable-next-line react/jsx-no-literals
    const fourK = support4K && display4K ? <div className={classNames(badgeClass, styles.fourK)}>4K</div> : null;

    if (showLiveIcon) {
      return <>
        {liveIcon}
        {fourK}
      </>;
    }
    if (timeDiff) {
      const date = intl.formatDate(startTime, {
        month: 'short',
        day: 'numeric',
      });
      const dateString = !isToday
        ? intl.formatMessage(messages.liveOn, {
          date,
        })
        : intl.formatMessage(messages.today, {
          time: toAMOrPM(startTime),
        });
      const timeStrings = [];

      if (timeDiff.minutes) {
        timeStrings.push(intl.formatMessage(messages.minute, {
          minute: timeDiff.minutes,
        }));
      }
      if (timeDiff.hours) {
        timeStrings.unshift(
          intl.formatMessage(messages.hour, {
            hour: timeDiff.hours || 0,
          })
        );
      }
      if (timeDiff.days) {
        timeStrings.unshift(
          intl.formatMessage(messages.day, {
            day: timeDiff.days,
          })
        );
      }
      if (!timeStrings.length) {
        timeStrings.push(intl.formatMessage(messages.minute, {
          minute: 1,
        }));
      }
      return (
        <div className={classNames(styles.badges, platformClass)}>
          <div className={classNames(badgeClass, styles.date)}>{dateString}</div>
          {displayTimer ? timeStrings.map((timeString) => (
            <div key={timeString} className={classNames(badgeClass, styles.time)}>
              {timeString}
            </div>
          )) : null}
          {fourK}
        </div>
      );
    }
    return null;
  };
