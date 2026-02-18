import { debounce } from 'lodash';
import { useEffect, useRef, useState } from 'react';

import { addEventListener, removeEventListener } from 'common/utils/dom';

const TIMELINE_DEBOUNCE_TIME_MS = 50;

/**
 * Allows tracking the dimensions of the timeline element.
 */
export const useTrackDimensions = () => {
  // dimensions
  const timelineElRef = useRef<HTMLDivElement>(null);
  // Leftmost pixel of the timeline. Updated after mount and on resize
  const [left, setLeft] = useState(0);
  // Width of timeline in pixels. Updated after mount and on resize
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const updateTimelineDimension = debounce(() => {
      // type guard
      /* istanbul ignore next */
      if (!timelineElRef.current) return;
      const rect = timelineElRef.current.getBoundingClientRect();
      setLeft(rect.left);
      setWidth(rect.width);
    }, TIMELINE_DEBOUNCE_TIME_MS);

    addEventListener(window, 'resize', updateTimelineDimension);
    updateTimelineDimension();
    return () => {
      removeEventListener(window, 'resize', updateTimelineDimension);
      updateTimelineDimension.cancel();
    };
  }, []);

  return { timelineElRef, left, width };
};
