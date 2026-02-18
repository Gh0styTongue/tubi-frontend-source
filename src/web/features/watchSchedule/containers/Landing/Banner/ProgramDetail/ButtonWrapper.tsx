import { BellNotification, CheckmarkStroke, Video } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';

import useLinearReminder from 'common/features/linearReminder/hooks/useLinearReminder';
import { isLoadingSelector } from 'common/features/linearReminder/selectors/linearReminder';
import { LinearPageType } from 'common/features/linearReminder/types/linearReminder';
import tubiHistory from 'common/history';
import useAppSelector from 'common/hooks/useAppSelector';
import landingMessages from 'web/features/watchSchedule/containers/Landing/landingMessages';
import { isSportsEventSelector } from 'web/features/watchSchedule/selectors/landing';
import type { Program } from 'web/features/watchSchedule/types/landing';

import styles from './ProgramDetail.scss';
import messages from '../bannerMessages';

interface ButtonWrapperProps {
  isLive: boolean;
  liveChannelLink: string;
  program: Program;
}

const ButtonWrapper = ({ isLive, liveChannelLink, program }: ButtonWrapperProps) => {
  const isRemindersLoading = useAppSelector(isLoadingSelector);
  const isSportsEvent = useAppSelector(isSportsEventSelector);

  const { formatMessage } = useIntl();

  const { dispatchReminderAction, hasReminderSet } = useLinearReminder({
    contentId: program.content_id,
    linearPageType: LinearPageType.linearLandingPage,
    programId: program.id,
    programTitle: program.title,
    startTime: program.start_time,
  });

  let icon = BellNotification;
  let buttonMessage = landingMessages.remindMe;

  if (isLive) {
    icon = Video;
    buttonMessage = landingMessages.watchNow;
  } else if (hasReminderSet) {
    icon = CheckmarkStroke;
    buttonMessage = landingMessages.reminderSet;
  }

  const buttonProps = {
    appearance: isLive ? ('primary' as const) : ('secondary' as const),
    children: formatMessage(buttonMessage),
    icon,
    iconSize: 'large' as const,
    loading: isRemindersLoading,
    tag: isLive ? formatMessage(landingMessages.free) : undefined,

    onClick: useCallback(() => {
      if (isLive) {
        tubiHistory.push(liveChannelLink);
      } else {
        dispatchReminderAction();
      }
    }, [dispatchReminderAction, isLive, liveChannelLink]),
  };

  return (
    <div
      className={classNames(styles.buttonWrapper, {
        [styles.hasReminderSet]: hasReminderSet,
      })}
    >
      <Button {...buttonProps} />
      {!isLive && <p>{formatMessage(isSportsEvent ? messages.whenNotifyForSportsEvent : messages.whenNotify)}</p>}
    </div>
  );
};

export default ButtonWrapper;
