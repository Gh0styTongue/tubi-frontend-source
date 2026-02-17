import { BellNotification, CheckmarkStroke } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { defineMessages } from 'react-intl';
import { useSelector } from 'react-redux';

import { isLoggedInSelector } from 'common/features/authentication/selectors/auth';
import type { StoreState } from 'common/types/storeState';
import type { VideoType } from 'common/types/video';
import { useIntl } from 'i18n/intl';

import styles from './RemindButton.scss';
import useReminder from './useReminder';

export const messages = defineMessages({
  remindMe: {
    description: 'text for remind button',
    defaultMessage: 'Remind Me',
  },
  reminderSet: {
    description: 'text for reminded status',
    defaultMessage: 'Remove Reminder',
  },
  reminderDesc: {
    description: 'description of reminded status',
    defaultMessage: 'You’ll be notified via email when this becomes available',
  },
});

export interface RemindButtonProps {
  className?: string;
  contentId: string;
  contentTitle: string;
  contentType: VideoType;
}

const RemindButton: FC<RemindButtonProps> = ({ className, ...restProps }) => {
  const intl = useIntl();

  const isReminderRequested = useSelector((state: StoreState) => state.reminder.loaded || state.reminder.hasError);
  const isLoggedIn = useSelector(isLoggedInSelector);
  const { dispatchReminderAction, hasReminderSet } = useReminder(restProps);

  // as reminder is loaded when content is unavailable, which is decided on client side
  // return null during SSR to prevent blink
  if (isLoggedIn && !isReminderRequested) {
    return null;
  }

  const button = hasReminderSet ? (
    <Button
      icon={CheckmarkStroke}
      className={classNames(styles.button, styles.selected)}
      appearance="tertiary"
      onClick={dispatchReminderAction}
    >
      <span>{intl.formatMessage(messages.reminderSet)}</span>
    </Button>
  ) : (
    <Button
      icon={BellNotification}
      className={styles.button}
      appearance="tertiary"
      onClick={dispatchReminderAction}
    >
      {intl.formatMessage(messages.remindMe)}
    </Button>
  );
  return (
    <div className={classNames(styles.remind, className)}>
      {button}
      <div className={styles.desc}>{intl.formatMessage(messages.reminderDesc)}</div>
    </div>
  );
};

export default RemindButton;
