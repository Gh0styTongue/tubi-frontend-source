import { useLayoutEffect, useRef } from 'react';

type UseStableLayoutEffectCallback = () => VoidFunction | undefined | void;

/**
 * @param callback - A callback that returns a cleanup function. Must be memoized with useCallback.
 * @description This hook is useful when you want to ensure that a callback is not re-run on every render.
 * It throws an error if the callback causes a re-render or if it is not memoized with useCallback.
 * @example
 * useStableLayoutEffect(useCallback(() => {
 *   return () => {
 *     console.log('cleanup', someStableDependency);
 *   };
 * }, [someStableDependency]));
 */
export function useStableLayoutEffect(callback: UseStableLayoutEffectCallback) {
  const callbackRef = useRef<UseStableLayoutEffectCallback>(callback);

  if (callbackRef.current !== callback) {
    throw new Error(
      'useStableLayoutEffect: callback must be memoized with useCallback to prevent re-subscription on every render'
    );
  }

  useLayoutEffect(() => {
    const cleanupFn = callback();

    return () => {
      cleanupFn?.();
    };
  }, [callback]);
}
