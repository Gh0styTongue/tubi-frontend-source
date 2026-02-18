import type React from 'react';
import { useCallback, useRef } from 'react';

interface UseFullscreenHandlerParams {
  toggleFullscreen: () => void;
  isFullscreen: boolean,
}

export const useFullscreenHandler = ({
  toggleFullscreen,
  isFullscreen,
}: UseFullscreenHandlerParams) => {

  const toggleFullscreenRef = useRef(toggleFullscreen);
  toggleFullscreenRef.current = toggleFullscreen;
  const isFullscreenRef = useRef(isFullscreen);
  isFullscreenRef.current = isFullscreen;

  const handleClickFullscreen = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    toggleFullscreenRef.current();
  }, []);

  return {
    handleClickFullscreen,
  };
};
