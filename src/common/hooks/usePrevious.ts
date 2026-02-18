import { useRef, useEffect } from 'react';

export function usePrevious<T>(value: T) {
  const ref = useRef<T>();
  // eslint-disable-next-line tubitv/no-missing-useeffect-deps -- intentionally run after every re-render
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}
