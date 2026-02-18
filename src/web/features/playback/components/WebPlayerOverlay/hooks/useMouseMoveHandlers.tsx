import throttle from 'lodash/throttle';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { playerStateSelector } from 'common/selectors/playerStore';

const OVERLAY_INACTIVE_DELAY = 500;

const MOUSE_MOVE_THROTTLE_DELAY = 50;

interface UseMouseMoveHandlersArgs {
  refreshActiveTimer: () => void;
  setInactive: () => void;
  cancelOverlayTimer: () => void;
  isShowingOverlayOnStartPlayback: boolean;
  captionSettingsVisible: boolean;
  qualitySettingsVisible: boolean;
}

export const useMouseMoveHandlers = ({
  refreshActiveTimer,
  setInactive,
  cancelOverlayTimer,
  isShowingOverlayOnStartPlayback,
  captionSettingsVisible,
  qualitySettingsVisible,
}: UseMouseMoveHandlersArgs) => {
  const playerState = useAppSelector(playerStateSelector);
  const inactiveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const refreshActiveTimerRef = useLatest(refreshActiveTimer);
  const setInactiveRef = useLatest(setInactive);
  const cancelOverlayTimerRef = useLatest(cancelOverlayTimer);
  const playerStateRef = useLatest(playerState);
  const isShowingOverlayOnStartPlaybackRef = useLatest(isShowingOverlayOnStartPlayback);
  const captionSettingsVisibleRef = useLatest(captionSettingsVisible);
  const qualitySettingsVisibleRef = useLatest(qualitySettingsVisible);

  const onMouseMove = useMemo(
    () => throttle(() => {
      refreshActiveTimerRef.current();
    }, MOUSE_MOVE_THROTTLE_DELAY),
    [refreshActiveTimerRef],
  );

  useEffect(() => () => {
    onMouseMove.cancel();
    clearTimeout(inactiveTimerRef.current);
  }, [onMouseMove]);

  const onMouseLeave = useCallback(() => {
    if (playerStateRef.current !== 'playing' || isShowingOverlayOnStartPlaybackRef.current
      || captionSettingsVisibleRef.current || qualitySettingsVisibleRef.current) return;

    cancelOverlayTimerRef.current();
    inactiveTimerRef.current = setTimeout(setInactiveRef.current, OVERLAY_INACTIVE_DELAY);
  }, [
    setInactiveRef,
    cancelOverlayTimerRef,
    playerStateRef,
    isShowingOverlayOnStartPlaybackRef,
    captionSettingsVisibleRef,
    qualitySettingsVisibleRef,
  ]);

  return {
    onMouseMove,
    onMouseLeave,
  };
};
