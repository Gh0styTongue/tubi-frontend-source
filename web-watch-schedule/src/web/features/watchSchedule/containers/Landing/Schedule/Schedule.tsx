import React from 'react';
import { useIntl } from 'react-intl';

import useAppSelector from 'common/hooks/useAppSelector';
import {
  consecutiveNoScheduledDatesSelector,
  isSportsEventSelector,
  nowSelector,
  programsGroupByDateSelector,
  titleSelector,
} from 'web/features/watchSchedule/selectors/landing';

import ConsecutiveNoScheduledDates from './ConsecutiveNoScheduledDates';
import LoadMore from './LoadMore';
import ProgramList from './ProgramList';
import styles from './Schedule.scss';
import messages from './scheduleMessages';

const Schedule = () => {
  const { formatMessage } = useIntl();
  const consecutiveDates = useAppSelector(consecutiveNoScheduledDatesSelector);
  const isSportsEvent = useAppSelector(isSportsEventSelector);
  const now = useAppSelector(nowSelector);
  const programsGroupByDate = useAppSelector(programsGroupByDateSelector);
  const title = useAppSelector(titleSelector);

  return (
    <div className={styles.root}>
      <div className={styles.main}>
        <h2>{formatMessage(messages.title, { title })}</h2>
        <div className={styles.desc}>{formatMessage(isSportsEvent ? messages.descForSportsEvent : messages.desc)}</div>

        {consecutiveDates.map((date) => {
          if (typeof date === 'string') {
            const props = {
              key: date,
              date,
              isSportsEvent,
              now,
              programs: programsGroupByDate[date],
              title,
            };
            return <ProgramList {...props} />;
          }

          const dates = date;
          const props = {
            key: dates[0],
            dates,
            isSportsEvent,
            title,
          };
          return <ConsecutiveNoScheduledDates {...props} />;
        })}

        <LoadMore />
      </div>
    </div>
  );
};

export default Schedule;
