import debounce from 'lodash/debounce';
import { useEffect, useRef, useState } from 'react';

import useAppSelector from 'common/hooks/useAppSelector';
import { isInTheaterModeSelector } from 'common/selectors/ui';
import { addEventListener, removeEventListener } from 'common/utils/dom';

const SCROLL_HANDLER_DEBOUNCE_MILLIS = 100;
const PLAYER_FADE_LOWER_THRESHOLD = 95;
const PLAYER_FADE_UPPER_THRESHOLD = 105;

export const usePlayerFade = () => {
  const playerAreaRef = useRef<HTMLElement>(null);
  const [isPlayerFadeActive, setIsPlayerFadeActive] = useState(false);
  const isPlayerFadeActiveRef = useRef(isPlayerFadeActive);
  isPlayerFadeActiveRef.current = isPlayerFadeActive;

  const isTheater = useAppSelector(isInTheaterModeSelector);
  const isTheaterRef = useRef(isTheater);
  isTheaterRef.current = isTheater;

  useEffect(() => {
    const handleScroll = debounce(() => {
      const playerArea = playerAreaRef.current;

      // type guard
      /* istanbul ignore next */
      if (!playerArea) return;

      const boundingRect = playerArea.getBoundingClientRect();

      // Different fade logic for theater mode
      if (isTheaterRef.current) {
        setIsPlayerFadeActive(false);
      } else {
        if (boundingRect.bottom < PLAYER_FADE_LOWER_THRESHOLD && !isPlayerFadeActiveRef.current) {
          setIsPlayerFadeActive(true);
        } else if (boundingRect.bottom >= PLAYER_FADE_UPPER_THRESHOLD && isPlayerFadeActiveRef.current) {
          setIsPlayerFadeActive(false);
        }
      }
    }, SCROLL_HANDLER_DEBOUNCE_MILLIS);

    addEventListener(window, 'scroll', handleScroll);

    return () => {
      removeEventListener(window, 'scroll', handleScroll);
      handleScroll.cancel();
    };
  }, [playerAreaRef]);

  return { isPlayerFadeActive, playerAreaRef };
};
