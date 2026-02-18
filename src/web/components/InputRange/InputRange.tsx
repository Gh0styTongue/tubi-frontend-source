/**
 * <InputRange />
 *
 * simulate to be a range input
 */

import { clamp } from '@adrise/utils/lib/tools';
import classNames from 'classnames';
import throttle from 'lodash/throttle';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { addEventListener, removeEventListener } from 'common/utils/dom';

import styles from './InputRange.scss';

interface InputRangeProps {
  min: number;
  max: number;
  value: number;
  onChanged?: (position: number) => void;
  onChanging?: (position: number) => void;
  className?: string;
  isMiniPlayer?: boolean;
  useRefresh?: boolean;
}

const percent = (value: number, min: number, max: number) => {
  return (value / (max - min)) * 100;
};

const computeTargetPosition = (y: number, min: number, max: number, containerRef: React.RefObject<HTMLDivElement>) => {
  const node = containerRef.current;
  if (node) {
    const rect = node.getBoundingClientRect();
    const ratio = clamp(((rect.bottom - y) / rect.height), 0, 1);
    return Math.floor(ratio * (max - min));
  }
  return 0;
};

const InputRange = ({ min, max, value: propValue, onChanged, onChanging, className, isMiniPlayer }: InputRangeProps) => {
  const [value, setValue] = useState(propValue);
  const prevPropValueRef = useRef(propValue);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const onChangingRef = useRef(onChanging);

  useEffect(() => {
    onChangingRef.current = onChanging;
  }, [onChanging]);

  const throttledChanging = useMemo(() => {
    const invoke = (pos: number) => onChangingRef.current?.(pos);
    return throttle(invoke, 200, { leading: true, trailing: true });
  }, [onChangingRef]);

  useEffect(() => {
    return () => {
      throttledChanging?.cancel();
    };
  }, [throttledChanging]);

  useEffect(() => {
    if (propValue !== prevPropValueRef.current) {
      if (propValue !== value) {
        setValue(propValue);
      }
    }
    prevPropValueRef.current = propValue;
  }, [propValue, value]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const position = computeTargetPosition(e.clientY, min, max, containerRef);
    setValue(position);
    onChanging?.(position);
  }, [onChanging, min, max]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    onChanged?.(computeTargetPosition(e.clientY, min, max, containerRef));
  }, [onChanged, min, max]);

  useEffect(() => {
    addEventListener(window, 'mousemove', handleMouseMove);
    addEventListener(window, 'mouseup', handleMouseUp);
    return () => {
      removeEventListener(window, 'mousemove', handleMouseMove);
      removeEventListener(window, 'mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isDraggingRef.current) {
      onChanged?.(computeTargetPosition(e.clientY, min, max, containerRef));
    }
  }, [onChanged, min, max]);

  const handleScrubberMouseDown = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  return (
    <div className={classNames(styles.inputRange, className, { [styles.isMiniPlayer]: isMiniPlayer })} onClick={handleClick} ref={containerRef}>
      <div className={styles.track}>
        <div className={styles.past} style={{ height: `${percent(value, min, max)}%` }} />
      </div>
      <span className={styles.scrubber} onMouseDown={handleScrubberMouseDown} style={{ bottom: `${percent(value, min, max)}%` }} />
    </div>
  );
};

export default InputRange;
