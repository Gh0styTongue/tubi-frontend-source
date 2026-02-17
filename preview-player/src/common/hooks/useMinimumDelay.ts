import { now } from '@adrise/utils/lib/time';
import { useCallback, useEffect, useRef } from 'react';

/**
 *
 * @param callback - The callback function to be called after the minimum delay
 * @param minimumDelay - The minimum delay in milliseconds
 * @returns
 * - markStartTime: A function to start the timer
 * - triggerCallback: A function to trigger the callback after the minimum delay
 * The callback function will be called immediately if the remaining time is less than or equal to 0
 *
 */
function useMinimumDelay<T extends(...args: any[]) => void>(callback: T, minimumDelay: number) {
  const startTimeRef = useRef<number | undefined>();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>();

  const triggerCallback = useCallback((...args: Parameters<T>) => {
    if (minimumDelay <= 0) return callback(...args);
    if (startTimeRef.current === undefined) return;

    const elapsedTime = now() - startTimeRef.current;
    const remainingTime = minimumDelay - elapsedTime;

    if (remainingTime > 0) {
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, remainingTime);
    } else {
      callback(...args);
    }
    startTimeRef.current = undefined;
  }, [callback, minimumDelay]);

  const markStartTime = useCallback(() => {
    if (startTimeRef.current !== undefined) return;
    startTimeRef.current = now();
  }, []);

  useEffect(() => () => {
    clearTimeout(timeoutRef.current);
  });

  return { markStartTime, triggerCallback };
}

export default useMinimumDelay;
