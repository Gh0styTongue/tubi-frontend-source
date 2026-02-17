import { BellNotification, CheckmarkStroke, Video } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';

import useLinearReminder from 'common/features/linearReminder/hooks/useLinearReminder';
import { isLoadingSelector } from 'common/features/linearReminder/selectors/linearReminder';
import { LinearPageType } from 'common/features/linearReminder/types/linearReminder';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import { getSeasonAndEpisodeNumberText } from 'common/utils/episode';
import LiveLabel from 'web/features/watchSchedule/components/LiveLabel/LiveLabel';
import landingMessages from 'web/features/watchSchedule/containers/Landing/landingMessages';
import { isSportsEventSelector, liveChannelUrlSelector } from 'web/features/watchSchedule/selectors/landing';
import type { Program } from 'web/features/watchSchedule/types/landing';
import { isSpanishContent } from 'web/features/watchSchedule/utils/landing';

import styles from './Schedule.scss';
import messages from './scheduleMessages';

interface ProgramItemProps {
  now: Dayjs;
  program: Program;
}

const ProgramItem = ({ now, program }: ProgramItemProps) => {
  const { formatMessage } = useIntl();
  const { id: programId, content_id: contentId, episode_title: episodeTitle, title: programTitle } = program;
  const isRemindersLoading = useAppSelector(isLoadingSelector);
  const isSportsEvent = useAppSelector(isSportsEventSelector);
  const liveChannelLink = useAppSelector((state) => liveChannelUrlSelector(state, contentId));

  const season = program.season_number as number;
  const episode = program.episode_number as number;

  const { dispatchReminderAction, hasReminderSet } = useLinearReminder({
    contentId,
    linearPageType: LinearPageType.linearLandingPage,
    programId,
    programTitle,
    startTime: program.start_time,
  });

  const startTime = dayjs(program.start_time);
  const endTime = dayjs(program.end_time);
  const isLive = now.isAfter(startTime) && now.isBefore(endTime);

  let title = isSportsEvent
    ? programTitle
    : `${programTitle} ${getSeasonAndEpisodeNumberText({
      formatMessage,
      season,
      episode,
    })}`;

  if (isSpanishContent(contentId)) {
    title += ' (En Español)';
  }

  let icon = BellNotification;
  let buttonMessage = landingMessages.remindMe;
  let titleMessage = formatMessage(messages.programTitle, {
    title,
    episodeTitle,
    duration: endTime.diff(startTime, 'minutes'),
  });

  if (isLive) {
    icon = Video;
    buttonMessage = landingMessages.watchNow;
    titleMessage = formatMessage(messages.liveProgramTitle, {
      title,
      episodeTitle,
      left: endTime.diff(now, 'minutes'),
    });
  } else if (hasReminderSet) {
    icon = CheckmarkStroke;
    buttonMessage = landingMessages.reminderSet;
  }

  if (isSportsEvent) {
    titleMessage = `${title} - ${episodeTitle}`;
  }

  const buttonProps = {
    appearance: isLive ? ('secondary' as const) : ('tertiary' as const),
    children: formatMessage(buttonMessage),
    icon,
    iconSize: 'large' as const,
    loading: isRemindersLoading,

    onClick: useCallback(() => {
      if (isLive) {
        tubiHistory.push(liveChannelLink);
      } else {
        dispatchReminderAction();
      }
    }, [liveChannelLink, dispatchReminderAction, isLive]),
  };

  return (
    <li
      data-test-id="schedule-program-item"
      className={classNames(styles.item, {
        [styles.isLive]: isLive,
      })}
    >
      <div className={styles.content}>
        <div className={styles.time}>{isLive ? <LiveLabel /> : startTime.format('h:mm A')}</div>
        <div className={styles.title}>{titleMessage}</div>
      </div>
      <div className={styles.buttonWrapper}>
        <Button {...buttonProps} />
      </div>
    </li>
  );
};

export default ProgramItem;
