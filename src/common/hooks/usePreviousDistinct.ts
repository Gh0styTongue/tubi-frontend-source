import { useRef } from 'react';

import { useFirstMountState } from './useFirstMountState';

type Predicate<T> = (prev: T | undefined, next: T) => boolean;

const strictEquals = <T>(prev: T | undefined, next: T) => prev === next;

/**
 * Similar to usePrevious but it will only update once the value actually changes.
 * This is important when other hooks are involved and you aren't just interested in the previous props version,
 * but want to know the previous distinct value
 */

export function usePreviousDistinct<T>(
  value: T,
  compare: Predicate<T> = strictEquals
): T | undefined {
  const prevRef = useRef<T>();
  const curRef = useRef<T>(value);
  const isFirstMount = useFirstMountState();

  if (!isFirstMount && !compare(curRef.current, value)) {
    prevRef.current = curRef.current;
    curRef.current = value;
  }

  return prevRef.current;
}
