import { ButtonType } from '@tubitv/analytics/lib/componentInteraction';
import type React from 'react';
import { useCallback, useRef } from 'react';

import * as eventTypes from 'common/constants/event-types';
import { buildComponentInteractionEvent } from 'common/utils/analytics';
import { getCurrentPathname } from 'common/utils/getCurrentPathname';
import { trackEvent } from 'common/utils/track';

interface UseTheaterModeHandlerParams {
  toggleFullscreen: () => void;
  toggleTheaterMode: () => void;
  isFullscreen: boolean,
  isTheater: boolean,
}

export const useTheaterModeHandler = ({
  toggleFullscreen,
  toggleTheaterMode,
  isFullscreen,
  isTheater,
}: UseTheaterModeHandlerParams) => {

  const toggleFullscreenRef = useRef(toggleFullscreen);
  toggleFullscreenRef.current = toggleFullscreen;
  const toggleTheaterModeRef = useRef(toggleTheaterMode);
  toggleTheaterModeRef.current = toggleTheaterMode;
  const isFullscreenRef = useRef(isFullscreen);
  isFullscreenRef.current = isFullscreen;
  const isTheaterRef = useRef(isTheater);
  isTheaterRef.current = isTheater;

  const trackClickTheaterMode = useCallback(() => {
    const event = buildComponentInteractionEvent({
      pathname: getCurrentPathname(),
      userInteraction: isTheaterRef.current ? 'TOGGLE_OFF' : 'TOGGLE_ON',
      component: 'BUTTON',
      buttonType: ButtonType.TOGGLE,
      buttonValue: 'THEATER_MODE',
    });
    trackEvent(eventTypes.COMPONENT_INTERACTION_EVENT, event);
  }, []);

  const handleClickTheater = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // exit fullscreen mode before entering theater
    if (isFullscreenRef.current && !isTheaterRef.current) {
      toggleFullscreenRef.current();
    }
    trackClickTheaterMode();
    toggleTheaterModeRef.current();
    // scroll to the top of the page when entering theater mode
    window.scrollTo(0, 0);
  }, [trackClickTheaterMode]);

  return {
    handleClickTheater,
  };
};
