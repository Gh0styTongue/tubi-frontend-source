import { FULLSCREEN_CHANGE_EVENTS } from '@adrise/player/lib';
import { PauseState, PlayerDisplayMode, ToggleState } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useEffect, useRef } from 'react';

import { setFullscreen } from 'common/actions/ui';
import * as eventTypes from 'common/constants/event-types';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMobileDeviceSelector } from 'common/selectors/ui';
import { buildFullscreenToggleEventObject, buildPauseToggleEventObject } from 'common/utils/analytics';
import {
  addEventListener,
  removeEventListener,
  enterFullscreen, exitFullscreen, getFullscreenElement, lockMobileOrientation } from 'common/utils/dom';
import { trackEvent } from 'common/utils/track';

interface UsePlayerFullscreenParams {
  contentId: string;
}

/**
 * Encapsulates code and state related to fullscreening the player
 */
export const usePlayerFullscreen = ({ contentId }: UsePlayerFullscreenParams) => {
  const dispatch = useAppDispatch();
  const isMobile = useAppSelector(isMobileDeviceSelector);
  const { getPlayerInstance } = useGetPlayerInstance();

  const fullscreenElRef = useRef<HTMLElement | Element>();

  /**
   * Intended to get this platform's fullscreen element and store it
   * in the ref, defaulting to the body
   */
  useEffect(() => {
    fullscreenElRef.current = getFullscreenElement() || document.body;
  }, []);

  /**
   * Enables a true fullscreen experience on devices which support this.
   * Does not need to invoke `dispatchAndTrackFullscreenChange`, as the
   * browser's fullscreen event will fire and trigger this for us.
   */
  const enableWholeScreenFullscreen = useCallback(() => {
    // type guard
    /* istanbul ignore next */
    if (!fullscreenElRef.current || !(fullscreenElRef.current instanceof HTMLElement)) return;
    enterFullscreen(fullscreenElRef.current);
  }, []);

  /**
   * Disable the whole-browser fullscreen experience.
   * Does not need to invoke `dispatchAndTrackFullscreenChange`, as the
   * browser's fullscreen event will fire and trigger this for us.
   */
  const disableWholeScreenFullscreen = useCallback(() => exitFullscreen(), []);

  /**
   * Intended to pause playback on devices where we do not allow inline playback
   * (e.g. Android, which is full-screen only).
   */
  const pauseAfterFullscreenExit = useCallback(() => {
    const player = getPlayerInstance();
    if (!player) return;
    player.pause();
    trackEvent(eventTypes.PAUSE_TOGGLE, buildPauseToggleEventObject(contentId, PauseState.PAUSED, PlayerDisplayMode.DEFAULT));
  }, [contentId, getPlayerInstance]);

  /**
   * An internal helper for fullscreen changes which may be invoked for both
   * "whole-screen fullscreen" and "in-browser fullscreen" experiences.
   */
  const dispatchAndTrackFullscreenChange = useCallback((isFullscreen: boolean, { track = true }: { track?: boolean } = {}) => {
    dispatch(setFullscreen(isFullscreen));

    if (track) {
      trackEvent(eventTypes.FULLSCREEN_TOGGLE, buildFullscreenToggleEventObject(contentId, isFullscreen ? ToggleState.ON : ToggleState.OFF));
    }

    /**
     * On mobile devices we stop playback and show the
     * play button when exiting fullscreen (such as via the back button)
     *
     * Note that we do not need to unlock orientation because it can only
     * be locked when in fullscreen
     */
    if (isMobile) {
      if (!isFullscreen) return pauseAfterFullscreenExit();
      lockMobileOrientation('landscape');
    }

  }, [contentId, dispatch, isMobile, pauseAfterFullscreenExit]);

  /**
   * Handler suitable to be passed down for enabling fullscreen experiemnces
   * on all devices. Intended to delegate work to other handlers in this
   * component depending on the type of fullscreen experience available
   * on the devices
   */
  const requestFullscreen = useCallback((fullscreen: boolean) => {

    if (fullscreen) {
      enableWholeScreenFullscreen();

    } else {
      disableWholeScreenFullscreen();

      // On non-iPad devices only, we pause playback when exiting fullscreen
      // this is tied to the existence of the physical back button on
      // Android devices
      if (isMobile) {
        pauseAfterFullscreenExit();
      }
    }
  }, [disableWholeScreenFullscreen, enableWholeScreenFullscreen, pauseAfterFullscreenExit, isMobile]);

  /**
   * Handle fullscreen change events coming from the DOM
   */
  useEffect(() => {
    const handleFullscreenChangeEvent = () => {
      const isFullscreen = !!getFullscreenElement();
      dispatchAndTrackFullscreenChange(isFullscreen);
    };
    addEventListener(document, FULLSCREEN_CHANGE_EVENTS, handleFullscreenChangeEvent);
    return () => {
      removeEventListener(document, FULLSCREEN_CHANGE_EVENTS, handleFullscreenChangeEvent);
    };
  }, [dispatchAndTrackFullscreenChange]);

  /**
   * If we've already got a fullscreenElement set on the DOM when we first render,
   * this indicates that the user got to this page via autoplay or some other
   * navigation event that took place while they had the player in fullscreen
   * mode. This means we need to sync the DOM fullscreen state back to the
   * application state so that the player can be properly sized and positioned
   * to match the face that the body element covers the whole viewport
   */
  useEffect(() => {
    if (getFullscreenElement() === document.body) {
      // we don't need to track re-entering fullscreen in this case as
      // the state change is not initiated by the user
      dispatchAndTrackFullscreenChange(true, { track: false });
    }
    // explicitly run only on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    requestFullscreen,
  };
};
