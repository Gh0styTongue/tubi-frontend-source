import { BellNotification, CheckmarkStroke } from '@tubitv/icons';
import { Button } from '@tubitv/web-ui';
import classNames from 'classnames';
import type { FC } from 'react';
import React from 'react';
import { defineMessages } from 'react-intl';

import type { VideoType } from 'common/types/video';
import { useIntl } from 'i18n/intl';
import useReminder from 'web/rd/components/ContentDetail/RemindButton/useReminder';

import styles from './RemindButton.scss';

export const messages = defineMessages({
  remindMe: {
    description: 'text for remind button',
    defaultMessage: 'Set Reminder',
  },
  reminderSet: {
    description: 'text for reminded status',
    defaultMessage: 'Remove Reminder',
  },
});

export interface RemindButtonProps {
  contentId: string;
  contentTitle: string;
  contentType: VideoType;
}

const RemindButton: FC<RemindButtonProps> = (props) => {
  const intl = useIntl();

  const { dispatchReminderAction, hasReminderSet } = useReminder(props);

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
      appearance="primary"
      onClick={dispatchReminderAction}
    >
      {intl.formatMessage(messages.remindMe)}
    </Button>
  );
  return (
    <div className={styles.remind}>
      {button}
    </div>
  );
};

export default RemindButton;
