import { Button } from '@tubitv/web-ui';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import React, { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';

import useAppSelector from 'common/hooks/useAppSelector';
import { batchFetchPrograms } from 'web/features/watchSchedule/actions/landing';
import { contentIdsSelector, lastDateSelector, loadMoreSelector } from 'web/features/watchSchedule/selectors/landing';

import styles from './Schedule.scss';
import messages from './scheduleMessages';

dayjs.extend(utc);

const LoadMore = () => {
  const dispatch = useDispatch();
  const { formatMessage } = useIntl();
  const contentIds = useAppSelector(contentIdsSelector);
  const lastDate = useAppSelector(lastDateSelector);
  const { isVisible, isLoading } = useAppSelector(loadMoreSelector);

  const onClick = useCallback(() => {
    batchFetchPrograms({
      contentIds,
      dispatch,
      lastDate,
      lookahead: 3,
    });
  }, [contentIds, dispatch, lastDate]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={styles.loadMore}>
      <Button appearance="tertiary" loading={isLoading} onClick={onClick}>
        {formatMessage(messages.loadMore)}
      </Button>
    </div>
  );
};

export default LoadMore;
