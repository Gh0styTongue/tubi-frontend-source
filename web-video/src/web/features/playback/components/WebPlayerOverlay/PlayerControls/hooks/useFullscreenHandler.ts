import { FULLSCREEN_CHANGE_EVENTS } from '@adrise/player/lib';
import type React from 'react';
import { useCallback, useRef, useEffect } from 'react';

import { addEventListener, removeEventListener, getFullscreenElement } from 'common/utils/dom';

export interface UseFullscreenHandlerParams {
  toggleFullscreen: () => void;
  toggleTheaterMode: () => void;
  isFullscreen: boolean,
  isTheater: boolean,
}

export const useFullscreenHandler = ({
  toggleFullscreen,
  toggleTheaterMode,
  isFullscreen,
  isTheater,
}: UseFullscreenHandlerParams) => {

  const toggleFullscreenRef = useRef(toggleFullscreen);
  toggleFullscreenRef.current = toggleFullscreen;
  const toggleTheaterModeRef = useRef(toggleTheaterMode);
  toggleTheaterModeRef.current = toggleTheaterMode;
  const isFullscreenRef = useRef(isFullscreen);
  isFullscreenRef.current = isFullscreen;
  const isTheaterRef = useRef(isTheater);
  isTheaterRef.current = isTheater;

  const isTheaterModeBeforeFullscreen = useRef<boolean>(false);

  const handleClickFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleFullscreenRef.current();
  }, []);

  /**
   * Keep/Restore theater mode event in fullscreen change event
   */
  useEffect(() => {
    const handleFullscreenChangeEvent = () => {
      const isFullscreen = !!getFullscreenElement();
      const isTheaterMode = isTheaterRef.current;
      const shouldRestoreTheaterMode = isTheaterModeBeforeFullscreen.current;

      if (isFullscreen) {
        // keep theater mode state before we enter fullscreen
        isTheaterModeBeforeFullscreen.current = isTheaterMode;
        // exit theater mode before entering fullscreen
        if (isTheaterMode) {
          toggleTheaterModeRef.current();
        }
      } else if (shouldRestoreTheaterMode && !isTheaterMode) {
        // Restore(re-enable) theater mode after we exit full-screen
        // Add this in fullscreen event listener, because `ESC` key can exit fullscreen but we don't catch this key event
        toggleTheaterModeRef.current();
      }
    };

    addEventListener(document, FULLSCREEN_CHANGE_EVENTS, handleFullscreenChangeEvent);
    return () => {
      removeEventListener(document, FULLSCREEN_CHANGE_EVENTS, handleFullscreenChangeEvent);
    };
  }, []);

  return {
    handleClickFullscreen,
  };
};
