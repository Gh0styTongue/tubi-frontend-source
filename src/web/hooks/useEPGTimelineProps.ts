import { hours, toAMOrPM } from '@adrise/utils/lib/time';
import { useCallback, useState } from 'react';
import { defineMessages, useIntl } from 'react-intl';

import { useUpdateCurrentDateByMinute } from 'common/hooks/useCurrentDate';
import { getWeekDayName } from 'common/utils/timeFormatting';

import { useTimeline } from './useEPG';

const ADVANCE_EPG_TIME_MS = hours(1);

const messages = defineMessages({
  backToLive: {
    description: 'cta label to go back to the current time on the epg page',
    defaultMessage: 'Back to Live',
  },
});

const useEPGTimelineProps = () => {
  useUpdateCurrentDateByMinute();
  const { formatMessage } = useIntl();
  const [advancedTimeCounter, setAdvancedTimeCounter] = useState(0);

  const { currentTime, startTime, endTime } = useTimeline();
  let epgStartTime = startTime;
  let epgEndTime = endTime;

  if (advancedTimeCounter) {
    epgStartTime = new Date(epgStartTime.getTime() + ADVANCE_EPG_TIME_MS * advancedTimeCounter);
    epgEndTime = new Date(epgEndTime.getTime() + ADVANCE_EPG_TIME_MS * advancedTimeCounter);
  }

  const onAdvanceTimeline = useCallback(() => {
    setAdvancedTimeCounter((count) => count + 1);
  }, []);

  const onRetreatTimeline = useCallback(() => {
    setAdvancedTimeCounter((count) => (count > 0 ? count - 1 : 0));
  }, []);

  const onTimelineBackToLive = useCallback(() => {
    setAdvancedTimeCounter(0);
  }, []);

  const timeFormatter = useCallback(
    (date: Date, isCurrent?: boolean): string => {
      if (!isCurrent && date.getHours() === 0 && date.getMinutes() === 0) {
        return `${getWeekDayName(date.getDay(), formatMessage)}, ${date.getDate()}`;
      }
      return toAMOrPM(date);
    },
    [formatMessage]
  );

  const backToLiveCTAText = formatMessage(messages.backToLive);

  return {
    advancedTimeCounter,
    backToLiveCTAText,
    currentTime,
    endTime: epgEndTime,
    onAdvanceTimeline,
    onRetreatTimeline,
    onTimelineBackToLive,
    startTime: epgStartTime,
    timeFormatter,
  };
};

export default useEPGTimelineProps;
