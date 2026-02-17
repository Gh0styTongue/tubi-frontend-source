import type { RefObject } from 'react';
import { useState, useCallback, useEffect } from 'react';

import useAppSelector from 'common/hooks/useAppSelector';
import useDocumentVisibility from 'common/hooks/useDocumentVisibility';

export const usePreviewPlayer = (initialVisible: boolean = false) => {
  const [isPreviewVisible, setIsPreviewVisible] = useState(initialVisible);

  const startVideoPreview = useCallback(() => {
    setIsPreviewVisible(true);
  }, []);
  const endVideoPreview = useCallback(() => {
    setIsPreviewVisible(false);
  }, []);

  return {
    isPreviewVisible,
    setIsPreviewVisible,
    onPreviewStart: startVideoPreview,
    onPreviewComplete: endVideoPreview,
    onPreviewError: endVideoPreview,
  };
};

export const useContainerRowPreviewPlayer = ({
  isVideoPreviewEnabled,
  activeIndex,
  playerWrapperRef,
}: {
  isVideoPreviewEnabled: boolean;
  activeIndex: number;
  playerWrapperRef: RefObject<HTMLDivElement>;
}) => {
  const activeTilePreviewCount = useAppSelector(state => state.ui.activeTilePreviewCount);
  const isPageVisible = useDocumentVisibility();
  const [isPreviewInViewport, setIsPreviewInViewport] = useState(true);
  const isPreviewPaused = !isPageVisible || !isPreviewInViewport || activeTilePreviewCount > 0;

  const {
    isPreviewVisible,
    setIsPreviewVisible,
    onPreviewStart,
    onPreviewComplete,
    onPreviewError,
  } = usePreviewPlayer(false);

  useEffect(() => {
    setIsPreviewVisible(false);
  }, [activeIndex, setIsPreviewVisible]);

  // When scrolling down and less than 30% of the preview player is visible, we set isPreviewInViewport false and pause playback
  useEffect(() => {
    if (!isVideoPreviewEnabled || !window.IntersectionObserver) return;

    const threshold = 0.3;
    const options = {
      root: null,
      rootMargin: '0px',
      threshold,
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        setIsPreviewInViewport(entry.intersectionRatio > threshold);
      });
    }, options);
    if (playerWrapperRef.current) {
      observer.observe(playerWrapperRef.current);
    }
    return () => {
      observer.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVideoPreviewEnabled, playerWrapperRef.current]);

  return {
    isPreviewVisible,
    isPreviewPaused,
    onPreviewStart,
    onPreviewComplete,
    onPreviewError,
  };
};

export const useTilePreviewPlayer = () => {
  const isPageVisible = useDocumentVisibility();
  return {
    ...usePreviewPlayer(true),
    isPreviewPaused: !isPageVisible,
  };
};
