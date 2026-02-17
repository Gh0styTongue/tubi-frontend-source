import { FULLSCREEN_CHANGE_EVENTS } from '@adrise/player/lib';
import type Player from '@adrise/player/lib/player';
import { PauseState, ToggleState } from '@tubitv/analytics/lib/playerEvent';
import { useCallback, useEffect, useRef } from 'react';

import { setFullscreen } from 'common/actions/ui';
import * as eventTypes from 'common/constants/event-types';
import useAppDispatch from 'common/hooks/useAppDispatch';
import useAppSelector from 'common/hooks/useAppSelector';
import { isMobileDeviceSelector } from 'common/selectors/ui';
import { buildFullscreenToggleEventObject, buildPauseToggleEventObject } from 'common/utils/analytics';
import {
  addEventListener,
  removeEventListener,
  disableScroll, enterFullscreen, exitFullscreen, getFullscreenElement, lockMobileOrientation } from 'common/utils/dom';
import { trackEvent } from 'common/utils/track';
import { shouldUseInBrowserFullscreenSelector } from 'web/features/playback/selectors/ui';

interface UsePlayerFullscreenParams {
  contentId: string;
  playerRef: React.MutableRefObject<InstanceType<typeof Player> | null>;
}

/**
 * Encapsulates code and state related to fullscreening the player
 */
export const usePlayerFullscreen = ({ contentId, playerRef }: UsePlayerFullscreenParams) => {
  const dispatch = useAppDispatch();
  const shouldUseInBrowserFullscreen = useAppSelector(shouldUseInBrowserFullscreenSelector);
  const isMobile = useAppSelector(isMobileDeviceSelector);

  const fullscreenElRef = useRef<HTMLElement | Element>();
  const restoreScrollStateRef = useRef<VoidFunction>();

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
    // type guard
    /* istanbul ignore next */
    if (!playerRef.current) return;
    playerRef.current.pause();
    trackEvent(eventTypes.PAUSE_TOGGLE, buildPauseToggleEventObject(contentId, PauseState.PAUSED));
  }, [contentId, playerRef]);

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
     * On non-iPad mobile devices (e.g. Android), we stop playback and show the
     * play button when exiting fullscreen (such as via the back button)
     *
     * Note that we do not need to unlock orientation because it can only
     * be locked when in fullscreen
     */
    if (isMobile && !shouldUseInBrowserFullscreen) {
      if (!isFullscreen) return pauseAfterFullscreenExit();
      lockMobileOrientation('landscape');
    }

  }, [contentId, dispatch, isMobile, shouldUseInBrowserFullscreen, pauseAfterFullscreenExit]);

  /**
   * Sets up an in-browser fullscreen experimence which causes the player
   * to take up the entire viewport without making the browser chrome invisible
   *
   * Intended for use on iOS devices
   */
  const enableInBrowserFullscreen = useCallback(() => {
    restoreScrollStateRef.current = disableScroll();
    dispatchAndTrackFullscreenChange(true);
  }, [dispatchAndTrackFullscreenChange]);

  /**
     * Tear down the in-browser fullscreen experience
     */
  const disableInBrowserFullscreen = useCallback(() => {
    restoreScrollStateRef.current?.();
    dispatchAndTrackFullscreenChange(false);
  }, [dispatchAndTrackFullscreenChange]);

  /**
   * Handler suitable to be passed down for enabling fullscreen experiemnces
   * on all devices. Intended to delegate work to other handlers in this
   * component depending on the type of fullscreen experience available
   * on the devices
   */
  const requestFullscreen = useCallback((fullscreen: boolean) => {

    if (fullscreen) {
      if (shouldUseInBrowserFullscreen) {
        enableInBrowserFullscreen();
      } else {
        enableWholeScreenFullscreen();
      }

    } else {
      if (shouldUseInBrowserFullscreen) {
        disableInBrowserFullscreen();
      } else {
        disableWholeScreenFullscreen();
      }

      // On non-iPad devices only, we pause playback when exiting fullscreen
      // this is tied to the existence of the physical back button on
      // Android devices
      if (isMobile && !shouldUseInBrowserFullscreen) {
        pauseAfterFullscreenExit();
      }
    }
  }, [disableInBrowserFullscreen, disableWholeScreenFullscreen, enableInBrowserFullscreen, enableWholeScreenFullscreen, pauseAfterFullscreenExit, shouldUseInBrowserFullscreen, isMobile]);

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
   * Ensure that we don't lock scroll if the user navigates away while in
   * in-browser fullscreen mode
   */
  useEffect(() => {
    return () => {
      restoreScrollStateRef.current?.();
    };
  }, []);

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
