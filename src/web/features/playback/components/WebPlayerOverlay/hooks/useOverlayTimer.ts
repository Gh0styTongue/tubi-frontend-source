import { useCallback, useEffect, useRef, useState } from 'react';

import { toggleTransportControl } from 'common/actions/ui';
import { PLAYER_CONTROL_FIRST_SHOW_TIMEOUT, PLAYER_CURSOR_IDLE_TIMEOUT } from 'common/constants/constants';
import { PLAYER_STATES } from 'common/constants/player';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { playerStateSelector } from 'common/selectors/playerStore';

export const OVERLAY_TRANSITION_DURATION_MILLISECONDS = 200;

export interface UseOverlayTimerProps {
  captionSettingsVisible: boolean;
  qualitySettingsVisible: boolean;
}

export const useOverlayTimer = ({ captionSettingsVisible, qualitySettingsVisible }: UseOverlayTimerProps) => {
  const dispatch = useAppDispatch();
  const playerState = useAppSelector(playerStateSelector);

  // allow access to latest value of player state in callbacks
  const latestPlayerStateRef = useRef(playerState);
  latestPlayerStateRef.current = playerState;

  // allow access to latest value of captionSettingsVisible in callbacks
  const latestCaptionSettingsVisibleRef = useRef(captionSettingsVisible);
  latestCaptionSettingsVisibleRef.current = captionSettingsVisible;

  // allow access to latest value of qualitySettingsVisible in callbacks
  const latestQualitySettingsVisibleRef = useRef(qualitySettingsVisible);
  latestQualitySettingsVisibleRef.current = qualitySettingsVisible;

  // The active timer, on completion, hides the overlay
  const hideActiveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // The render control timer, on completion, hides the control bar after it
  // animates out
  const renderControlTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // active means we want to show the control bar & title area
  // renderControls is a separate flag so we can go inactive, then remove controls after animation has completed
  const [active, setActive] = useState(true);

  // is the currently visible overlay visible becuase playback just started?
  // i.e. has it closed at all yet?
  const [isShowingOverlayOnStartPlayback, setIsShowingOverlayOnStartPlayback] = useState(true);

  /**
   * Starts the process of hiding the player overlay
   *
   * NOTE: when changing this function, be cautious not to reference state
   * values that might be stale if the hook rerenders. Even if they are declared
   * dependencies of useCallback as invoked here, setInactive is passed to
   * the dom as a timer callback.
   */
  const setInactive = useCallback(() => {
    setActive(false);
    clearTimeout(renderControlTimeoutRef.current);
    renderControlTimeoutRef.current = setTimeout(() => {
      dispatch(toggleTransportControl(false));
    }, OVERLAY_TRANSITION_DURATION_MILLISECONDS);
  }, [setActive, dispatch]);

  /**
   * Reset the timer which, when it counts down, hides the player overlay
   */
  const refreshActiveTimer = useCallback(() => {
    if (isShowingOverlayOnStartPlayback) return;
    clearTimeout(hideActiveTimerRef.current);
    clearTimeout(renderControlTimeoutRef.current);

    if (!active) {
      setActive(true);
      dispatch(toggleTransportControl(true));
    }

    if (playerState !== PLAYER_STATES.playing || captionSettingsVisible || qualitySettingsVisible) return;
    hideActiveTimerRef.current = setTimeout(setInactive, PLAYER_CURSOR_IDLE_TIMEOUT);
  }, [
    isShowingOverlayOnStartPlayback,
    active,
    dispatch,
    playerState,
    captionSettingsVisible,
    qualitySettingsVisible,
    setInactive,
  ]);

  /**
   * Intended to be called when the calling component mounts to show the overlay
   */
  const showOverlayOnStartPlayback = useCallback(() => {
    if (playerState !== PLAYER_STATES.playing) return;
    if (hideActiveTimerRef.current) return;
    clearTimeout(hideActiveTimerRef.current);
    hideActiveTimerRef.current = setTimeout(() => {
      setIsShowingOverlayOnStartPlayback(false);
      if (
        latestPlayerStateRef.current === PLAYER_STATES.playing &&
        !latestCaptionSettingsVisibleRef.current &&
        !latestQualitySettingsVisibleRef.current
      ) setInactive();
    }, PLAYER_CONTROL_FIRST_SHOW_TIMEOUT);
  }, [playerState, setInactive]);

  /**
   * Allows cancelling the countdown to making the control inactive &
   * to hiding the controls when the animation completes
   */
  const cancelOverlayTimer = useCallback(() => {
    clearTimeout(hideActiveTimerRef.current);
    clearTimeout(renderControlTimeoutRef.current);
  }, []);

  /**
   * Clear the active timer when the component unmounts
   */
  useEffect(() => cancelOverlayTimer, [cancelOverlayTimer]);

  /**
   * Show the overlay when playback starts
   */
  useEffect(() => {
    showOverlayOnStartPlayback();
    // show just after mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Ensure we call showOverlayOnStartPlayback again once playback has
   * started, as it may not have started by the time of the call above
   *
   * (Will retrigger if user plays/pauses before the initial disappearance
   * of the overlay, but this is okay as it will just reset the timer)
   *
   * (According to a comment in the old class-based code that was refactored to
   * this hook, this also supports a case where a casting session stops and
   * playback restarts on web)
   */
  useEffect(() => {
    if (playerState === PLAYER_STATES.playing && isShowingOverlayOnStartPlayback) showOverlayOnStartPlayback();
  }, [isShowingOverlayOnStartPlayback, playerState, showOverlayOnStartPlayback]);

  return {
    refreshActiveTimer,
    setInactive,
    active,
    isShowingOverlayOnStartPlayback,
    cancelOverlayTimer,
  };
};
