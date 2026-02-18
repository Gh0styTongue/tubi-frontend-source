import { mins, secs } from '@adrise/utils/lib/time';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';

import { UPDATE_CURRENT_DATE } from 'common/constants/action-types';
import { actionWrapper } from 'common/utils/action';

const calculateTimeDiff = (diffInMs: number) => {
  const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes };
};

const timeDiffCache: Record<string, ReturnType<typeof calculateTimeDiff>> = {};

export const useLiveEventCountdown = (startTime?: string, id?: string, skip?: boolean) => {
  const [timeDiff, setTimeDiff] = useState<ReturnType<typeof calculateTimeDiff> | undefined>(id ? timeDiffCache[id] : undefined);
  const dispatch = useDispatch();
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>();

  const resetTimeDiff = useCallback(() => { setTimeDiff(undefined); }, []);

  useEffect(() => {
    /* istanbul ignore next */
    if (skip) {
      clearInterval(intervalRef.current);
      resetTimeDiff();
      return;
    }

    if (!startTime || !id) return;

    const updateTimeDiff = () => {
      const now = new Date();
      const diffInMs = new Date(startTime).getTime() - now.getTime();

      clearInterval(intervalRef.current);

      // Dynamically adjust the setInterval frequency based on the time difference
      // If more than 1 minute remains, update every 1 minute
      // Else if less than 1 minute remains, update every second
      if (diffInMs > mins(1)) {
        intervalRef.current = setInterval(updateTimeDiff, mins(1));
      } else {
        if (diffInMs <= 0) {
          dispatch(actionWrapper(UPDATE_CURRENT_DATE));
          return;
        }
        intervalRef.current = setInterval(updateTimeDiff, secs(1));
      }
      const newTimeDiff = calculateTimeDiff(diffInMs);
      setTimeDiff(newTimeDiff);
      timeDiffCache[id] = newTimeDiff;
    };

    updateTimeDiff();

    return () => {
      clearInterval(intervalRef.current);

    };
  }, [startTime, id, dispatch, resetTimeDiff, skip]);

  return useMemo(() => ({ timeDiff }), [timeDiff]);
};
