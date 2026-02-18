import { useCallback, useRef } from 'react';

import useLatest from 'common/hooks/useLatest';
import { isDownSwipe } from 'common/utils/mobile';

type TouchInfo = {
  startX?: number;
  endX?: number;
  startY?: number;
  endY?: number;
  vertical?: boolean;
  isSwipeDown?: boolean;
};

type UseTouchHandlersArgs = {
  active: boolean;
  refreshActiveTimer: () => void;
  setInactive: () => void;
};

export function useTouchHandlers({
  active,
  refreshActiveTimer,
  setInactive,
}: UseTouchHandlersArgs) {
  const touchInfoRef = useRef<TouchInfo>();
  const activeRef = useLatest(active);

  const handleSwipe = useCallback(() => {
    const isSwipeDown = !!touchInfoRef.current?.isSwipeDown;
    if (!isSwipeDown || !activeRef.current) {
      refreshActiveTimer();
    } else {
      setInactive();
    }
    touchInfoRef.current = {};
  }, [refreshActiveTimer, setInactive, touchInfoRef, activeRef]);

  const onTouchStart = useCallback((event: React.TouchEvent) => {
    if (!event.touches) return;
    const touch = event.touches[0];
    touchInfoRef.current = {
      startX: touch.pageX,
      startY: touch.pageY,
    };
  }, []);

  const onTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchInfoRef.current) return;
    const { startX = -1, startY = -1 } = touchInfoRef.current;
    if (startX < 0 || startY < 0) return;
    const { pageX: endX, pageY: endY } = event.touches[0];
    const isSwipeDown = isDownSwipe({ startX, endX, startY, endY });
    touchInfoRef.current = {
      ...touchInfoRef.current,
      endX,
      endY,
      isSwipeDown,
    };
    if (!isSwipeDown) refreshActiveTimer();
  }, [refreshActiveTimer]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd: handleSwipe,
    onTouchCancel: handleSwipe,
    // exposed for testing only
    touchInfoRef,
  };
}
