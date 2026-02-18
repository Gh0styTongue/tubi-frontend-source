import classNames from 'classnames';
import dayjs from 'dayjs';
import React from 'react';
import { useIntl } from 'react-intl';

import styles from './Schedule.scss';
import messages from './scheduleMessages';

interface Props {
  dates: string[];
  isSportsEvent: boolean;
  title: string;
}

const formatDate = (date: string) => dayjs(date).format('MMMM DD');

const ConsecutiveNoScheduledDates = ({ dates, isSportsEvent, title }: Props) => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.programs}>
      <h3>
        {/* eslint-disable-next-line react/jsx-no-literals -- no i18n needed for punctuation */}
        {formatDate(dates[0])} - {formatDate(dates[dates.length - 1])}
      </h3>

      <div className={classNames(styles.body, styles.noShowing)}>
        {formatMessage(isSportsEvent ? messages.noShowingForSportsEvent : messages.noShowing, { title })}
      </div>
    </div>
  );
};

export default ConsecutiveNoScheduledDates;
