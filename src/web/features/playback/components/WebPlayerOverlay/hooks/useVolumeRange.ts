import { useCallback, useEffect, useRef, useState } from 'react';

export const TOGGLE_DELAY = 200;

export const useVolumeRange = () => {
  const [showVolumeRange, setShowVolumeRange] = useState(false);
  const showVolumeRangeRef = useRef(false);
  showVolumeRangeRef.current = showVolumeRange;
  const showVolumeRangeTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const hideVolumeRangeTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const makeVolumeRangeVisible = useCallback(() => {
    clearTimeout(showVolumeRangeTimerRef.current);
    showVolumeRangeTimerRef.current = setTimeout(() => {
      if (!showVolumeRangeRef.current) {
        setShowVolumeRange(true);
      }
    }, TOGGLE_DELAY);
  }, []);

  const makeVolumeRangeInvisible = useCallback(() => {
    clearTimeout(hideVolumeRangeTimerRef.current);
    hideVolumeRangeTimerRef.current = setTimeout(() => {
      if (showVolumeRangeRef.current) {
        setShowVolumeRange(false);
      }
    }, TOGGLE_DELAY);
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(showVolumeRangeTimerRef.current);
      clearTimeout(hideVolumeRangeTimerRef.current);
    };
  }, []);

  return {
    showVolumeRange,
    setShowVolumeRange,
    makeVolumeRangeVisible,
    makeVolumeRangeInvisible,
  };
};
