import classNames from 'classnames';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import React from 'react';
import { useIntl } from 'react-intl';

import type { Program } from 'web/features/watchSchedule/types/landing';

import ProgramItem from './ProgramItem';
import styles from './Schedule.scss';
import messages from './scheduleMessages';

interface ProgramListProps {
  date: string;
  isSportsEvent: boolean;
  now: Dayjs;
  programs?: Program[];
  title: string;
}

const ProgramList = ({ date, isSportsEvent, now, programs = [], title }: ProgramListProps) => {
  const { formatMessage } = useIntl();

  return (
    <div className={styles.programs}>
      <h3>
        {dayjs(date).format('MMMM DD')}
        {now.isSame(date, 'days') && <span>{formatMessage(messages.today)}</span>}
      </h3>

      {programs.length ? (
        <ul className={styles.body}>
          {programs.map((program, idx) => {
            const props = {
              key: idx,
              now,
              program,
            };
            return <ProgramItem {...props} />;
          })}
        </ul>
      ) : (
        <div className={classNames(styles.body, styles.noShowing)}>
          {formatMessage(isSportsEvent ? messages.noShowingForSportsEvent : messages.noShowing, { title })}
        </div>
      )}
    </div>
  );
};

export default ProgramList;
