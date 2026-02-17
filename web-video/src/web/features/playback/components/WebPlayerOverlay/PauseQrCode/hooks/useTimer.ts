import { useEffect, useRef, useState } from 'react';

export interface UseTimerParams {
  // how long does timer run
  duration: number;

  // when flipping from false to true, starts timer
  // timer cleared when false
  runTimer: boolean;

}

export const useTimer = ({ duration, runTimer }: UseTimerParams) => {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const [timerDone, setTimerDone] = useState(false);

  useEffect(() => {
    if (runTimer) {
      timerRef.current = setTimeout(() => {
        setTimerDone(true);
      }, duration);
    } else {
      clearTimeout(timerRef.current);
      setTimerDone(false);
    }

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [runTimer, duration]);

  return {
    timerDone,
  };
};
