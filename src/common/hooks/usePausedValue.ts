import type { ReactNode } from 'react';
import { useRef } from 'react';

export const usePausedValue = <VALUE extends unknown>(value: VALUE, { pause }: { pause: boolean }): VALUE => {
  const valueRef = useRef<VALUE>(value);

  if (!pause) {
    valueRef.current = value;
  }

  return valueRef.current;
};

type Props<VALUE extends unknown> = {
  value: VALUE,
  pause: boolean,
  render: (value: VALUE) => ReactNode,
};

// an adapter component so we can use it in class components
export const PausedValue = <VALUE extends unknown>({ value, pause, render }: Props<VALUE>) =>
  render(usePausedValue(value, { pause }));
