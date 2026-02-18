import { durationToHourAndMinute } from '@adrise/utils/lib/time';
import { useEffect, useState } from 'react';

import useAppSelector from 'common/hooks/useAppSelector';
import { positionSelector } from 'common/selectors/playerStore';

const useRemainingPlaybackTime = ({ duration }: { duration: number }) => {
  const contentPosition = useAppSelector(positionSelector);
  const [remainingTime, setRemainingTime] = useState<string | undefined>();

  useEffect(() => {
    const remaining = duration - contentPosition;
    const durationInHourAndMinute = durationToHourAndMinute(remaining);
    if (durationInHourAndMinute !== remainingTime) {
      setRemainingTime(durationInHourAndMinute);
    }
  }, [contentPosition, duration, remainingTime]);

  return remainingTime;
};

export default useRemainingPlaybackTime;
