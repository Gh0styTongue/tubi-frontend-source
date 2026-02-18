import { getStoredVolume, getStoredMuteState, saveMuteState, saveVolume } from '@adrise/player/lib/utils/volume';
import throttle from 'lodash/throttle';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { webKeys } from 'common/constants/key-map';

const DEFAULT_VOLUME = 30;
const VOLUME_STEP = 10;
const VOLUME_BAR_DISPLAY_DURATION = 1000;

interface UseLiveVolumeHandlerProps {
  wrapper: LivePlayerWrapper | null;
  volumeExpand: boolean;
  setVolumeExpand: (expand: boolean) => void;
  throttledResetIdleTimer: () => void;
}

export const useLiveVolumeHandler = ({
  wrapper,
  volumeExpand,
  setVolumeExpand,
  throttledResetIdleTimer,
}: UseLiveVolumeHandlerProps) => {
  // Timer management using ref
  const volumeBarTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearVolumeBarTimer = useCallback(() => {
    if (volumeBarTimerRef.current) {
      clearTimeout(volumeBarTimerRef.current);
      volumeBarTimerRef.current = null;
    }
  }, []);

  // Local state for volume and mute
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);

  const showVolumeBar = useCallback(() => {
    if (!isMuted) setVolumeExpand(true);
  }, [isMuted, setVolumeExpand]);

  const hideVolumeBar = useCallback(() => {
    if (volumeExpand) setVolumeExpand(false);
  }, [volumeExpand, setVolumeExpand]);

  // Update volume state
  const updateVolumeState = useCallback((newVolume: number, newMuted?: boolean) => {
    setVolumeState(newVolume);
    if (newMuted !== undefined) {
      setIsMuted(newMuted);
    }
  }, []);

  // Toggle mute state
  const toggleMutedState = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  // restore local volume state
  useEffect(() => {
    try {
      const localVolume = getStoredVolume() ?? DEFAULT_VOLUME;
      const localMuted = getStoredMuteState();
      updateVolumeState(localVolume, localMuted);
      wrapper?.setVolume(localVolume);
      wrapper?.setMute(localMuted);
    } catch (e) {
      // do nothing
    }
  }, [updateVolumeState, wrapper]);

  const showVolumeBarTemporarily = useCallback(() => {
    showVolumeBar();
    clearVolumeBarTimer();
    volumeBarTimerRef.current = setTimeout(() => {
      hideVolumeBar();
    }, VOLUME_BAR_DISPLAY_DURATION);
  }, [showVolumeBar, hideVolumeBar, clearVolumeBarTimer]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isMuted) {
      setVolumeExpand(true);
      if (!volumeExpand) return;
    }
    toggleMutedState();
    throttledResetIdleTimer();
    saveMuteState(!isMuted);
    wrapper?.setMute(!isMuted);
  }, [wrapper, isMuted, volumeExpand, toggleMutedState, throttledResetIdleTimer, setVolumeExpand]);

  const setVolume = useCallback((volume: number) => {
    if (!volumeExpand) setVolumeExpand(true);
    updateVolumeState(volume);
    saveVolume(volume);
    wrapper?.setVolume(volume);
  }, [wrapper, updateVolumeState, volumeExpand, setVolumeExpand]);

  const handleVolumeHotKey = useCallback((e: KeyboardEvent) => {
    const { keyCode, altKey, ctrlKey, metaKey, shiftKey } = e;

    // Early return for modifier keys or input elements
    if (
      altKey ||
      ctrlKey ||
      metaKey ||
      shiftKey ||
      (document.activeElement && document.activeElement.tagName.toLowerCase() === 'input')
    ) {
      return;
    }

    const { m, arrowUp, arrowDown, arrowLeft, arrowRight, home, end } = webKeys;
    const activeElement = document.activeElement;
    const isVolumeButtonFocused = activeElement?.id === 'volumeButton' ||
      activeElement?.closest('#volumeButton') !== null;

    const handleVolumeChange = (volume: number, change: number) => {
      e.preventDefault();
      const newVolume = Math.max(0, Math.min(100, volume + change));
      setVolume(newVolume);
      setVolumeState(newVolume);
      setIsMuted(newVolume === 0);
      throttledResetIdleTimer();
      showVolumeBarTemporarily();
    };

    switch (keyCode) {
      case end:
        if (!isVolumeButtonFocused) break;
        e.preventDefault();
        setVolume(100);
        setVolumeState(100);
        showVolumeBarTemporarily();
        break;
      case home:
        if (!isVolumeButtonFocused) break;
        e.preventDefault();
        setVolume(0);
        setVolumeState(0);
        showVolumeBarTemporarily();
        break;
      case m:
        e.preventDefault();
        toggleMutedState();
        throttledResetIdleTimer();
        saveMuteState(!isMuted);
        wrapper?.setMute(!isMuted);
        showVolumeBarTemporarily();
        break;
      case arrowUp:
        if (isVolumeButtonFocused) {
          e.preventDefault();
          handleVolumeChange(volume, VOLUME_STEP);
        }
        break;
      case arrowRight:
        if (isVolumeButtonFocused) {
          e.preventDefault();
          handleVolumeChange(volume, VOLUME_STEP);
        }
        break;
      case arrowDown:
        if (isVolumeButtonFocused) {
          e.preventDefault();
          handleVolumeChange(volume, -VOLUME_STEP);
        }
        break;
      case arrowLeft:
        if (isVolumeButtonFocused) {
          e.preventDefault();
          handleVolumeChange(volume, -VOLUME_STEP);
        }
        break;
      default:
        break;
    }
  }, [volume, isMuted, toggleMutedState, throttledResetIdleTimer, wrapper, setVolume, showVolumeBarTemporarily]);

  // Set up keyboard event listeners
  useEffect(() => {
    const throttledFn = throttle(handleVolumeHotKey, 50);
    window.addEventListener('keydown', throttledFn);

    return () => {
      window.removeEventListener('keydown', throttledFn);
      throttledFn.cancel();
    };
  }, [handleVolumeHotKey]);

  return {
    toggleMute,
    setVolume,
    volume,
    isMuted,
    showVolumeBar,
    hideVolumeBar,
    showVolumeBarTemporarily,
  };
};
