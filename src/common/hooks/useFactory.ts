import { useRef } from 'react';

/**
 * A custom hook that accepts a factory function to instantiate an object only once.
 */
export function useFactory<T>(factory: () => T): T {
  const ref = useRef<T>();
  if (typeof ref.current === 'undefined') {
    ref.current = factory();
  }
  return ref.current;
}
