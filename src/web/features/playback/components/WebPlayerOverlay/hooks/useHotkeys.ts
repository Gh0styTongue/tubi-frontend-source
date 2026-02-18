import { State as PLAYER_STATES } from '@adrise/player';
import { throttle } from 'lodash';
import { useCallback, useEffect, useRef } from 'react';

import { webKeys } from 'common/constants/key-map';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { captionsIndexSelector, captionsListSelector, isAdSelector, playerStateSelector } from 'common/selectors/playerStore';
import { isFullscreenSelector } from 'common/selectors/ui';

import type { SetVolumeFn } from './useVolumeHandlers';
import type { WebStepSeekFn } from '../PlayerControls/hooks/useSeekHandlers';

export interface UseHotkeysProps {
  requestFullscreen: (value: boolean) => void;
  isMuted: boolean;
  play: (explicit: boolean) => Promise<void>;
  pause: (explicit: boolean) => Promise<void>;
  stepRewind: WebStepSeekFn;
  stepForward: WebStepSeekFn;
  setVolume: SetVolumeFn;
  setCaptions: (index: number) => Promise<void>;
  refreshActiveTimer: () => void;
}

export const useHotkeys = ({
  requestFullscreen,
  isMuted,
  play,
  pause,
  stepRewind,
  stepForward,
  setVolume,
  setCaptions,
  refreshActiveTimer,
}: UseHotkeysProps) => {
  const throttledFnRef = useRef<ReturnType<typeof throttle>>();

  // prop refs
  const requestFullscreenRef = useLatest(requestFullscreen);
  const isMutedRef = useLatest(isMuted);
  const playRef = useLatest(play);
  const pauseRef = useLatest(pause);
  const stepRewindRef = useLatest(stepRewind);
  const stepForwardRef = useLatest(stepForward);
  const setVolumeRef = useLatest(setVolume);
  const setCaptionsRef = useLatest(setCaptions);
  const refreshActiveTimerRef = useLatest(refreshActiveTimer);

  // state selectors and state refs
  const playerState = useAppSelector(playerStateSelector);
  const playerStateRef = useLatest(playerState);
  const isAd = useAppSelector(isAdSelector);
  const isAdRef = useLatest(isAd);
  const captionsList = useAppSelector(captionsListSelector);
  const captionsListRef = useLatest(captionsList);
  const captionsIndex = useAppSelector(captionsIndexSelector);
  const captionsIndexRef = useLatest(captionsIndex);
  const isFullscreen = useAppSelector(isFullscreenSelector);
  const isFullscreenRef = useLatest(isFullscreen);

  /**
   * space & 'k': play/pause
   * left & 'j': jump back 30s
   * right & 'l': jump forward 30s
   * 'm': toggle mute
   * 'f': toggle fullscreen
   * escape : exit full screen
   * 'c': cycle subtitles
   */
  const handleHotKey = useCallback((e: KeyboardEvent) => {
    const { keyCode, altKey, ctrlKey, metaKey, shiftKey } = e;
    // if some combination of special key, dont perform hotkey functions
    if (
      altKey
      || ctrlKey
      || metaKey
      || shiftKey
      /**
       * activeElement could be `null`
       * https://developer.mozilla.org/en-US/docs/Web/API/DocumentOrShadowRoot/activeElement
       */
      || (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input')
    ) {
      return;
    }

    const { space, k, arrowLeft, j, arrowRight, l, m, f, c, escape, tab } = webKeys;

    // note the fallthroughs are intentional
    switch (keyCode) {
      case space:
        e.preventDefault();
      // falls through
      case k:
        if (playerStateRef.current === PLAYER_STATES.paused) {
          playRef.current(true);
        } else {
          pauseRef.current(true);
        }
        break;
      case arrowLeft:
        if (isAdRef.current) break;
        stepRewindRef.current('KEYBOARD_ARROW' as const);
        break;
      case j:
        if (isAdRef.current) break;
        stepRewindRef.current('KEYBOARD_LETTER' as const);
        break;
      case arrowRight:
        if (isAdRef.current) break;
        stepForwardRef.current('KEYBOARD_ARROW' as const);
        break;
      case l:
        if (isAdRef.current) break;
        stepForwardRef.current('KEYBOARD_LETTER' as const);
        break;
      case m:
        const mutePlayer = !isMutedRef.current;
        setVolumeRef.current({ isMuted: mutePlayer });
        break;
      case f:
        // toggle fullscreen
        requestFullscreenRef.current(!isFullscreenRef.current);
        break;
      case escape:
        if (isFullscreenRef.current) requestFullscreenRef.current(false);
        break;
      case c:
        if (isAdRef.current) break;
        const newIndex = captionsIndexRef.current + 1 >= captionsListRef.current.length ? 0 : captionsIndexRef.current + 1;
        setCaptionsRef.current(newIndex);
        break;
      case tab:
        refreshActiveTimerRef.current();
        break;
      default:
        break;
    }
  }, [
    // Depend only on refs to minimize regeneration
    playerStateRef,
    playRef,
    pauseRef,
    stepRewindRef,
    stepForwardRef,
    setVolumeRef,
    setCaptionsRef,
    requestFullscreenRef,
    isMutedRef,
    isAdRef,
    captionsListRef,
    captionsIndexRef,
    isFullscreenRef,
    refreshActiveTimerRef,
  ]);

  useEffect(() => {
    throttledFnRef.current?.cancel();
    const throttledFn = throttle(handleHotKey, 50);
    throttledFnRef.current = throttledFn;
    window.addEventListener('keydown', throttledFn);

    return () => {
      window.removeEventListener('keydown', throttledFn);
      throttledFn.cancel();
    };
  }, [handleHotKey]);
};
