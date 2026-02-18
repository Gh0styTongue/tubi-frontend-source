import throttle from 'lodash/throttle';
import { useCallback, useState, useEffect, useRef } from 'react';

import { setTopNavVisibleState } from 'common/actions/ui';
import PlayerWebTheaterMode from 'common/experiments/config/playerWebTheaterMode';
import useAppSelector from 'common/hooks/useAppSelector';
import useExperiment from 'common/hooks/useExperiment';
import { isInTheaterModeSelector, isMobileDeviceSelector } from 'common/selectors/ui';
import type { TubiThunkDispatch } from 'common/types/reduxThunk';
import { addEventListener, removeEventListener } from 'common/utils/dom';

interface UseTheaterModeProps {
  dispatch: TubiThunkDispatch;
}

export const THEATER_MODE_TOP_HEIGHT = 96;
export const THEATER_MODE_BOTTOM_HEIGHT = 128;
export const THEATER_MODE_PLAYER_STICKY_DISTANCE = 60;

export const getTheaterPlayerPosition = ({
  innerHeight,
  innerWidth,
}: {
  innerHeight: number,
  innerWidth: number,
}) => {
  const maxHeight = innerHeight - THEATER_MODE_TOP_HEIGHT - THEATER_MODE_BOTTOM_HEIGHT;
  let width = 0; let height = 0; let left = 0; let
    top = 0;
  if (maxHeight > innerWidth * 9 / 16) {
    width = innerWidth;
    height = innerWidth * 9 / 16;
    left = 0;
    top = (maxHeight - height) / 2 + THEATER_MODE_TOP_HEIGHT;
  } else {
    width = maxHeight * 16 / 9;
    height = maxHeight;
    top = THEATER_MODE_TOP_HEIGHT;
    left = (innerWidth - width) / 2;
  }
  return {
    width,
    height,
    left,
    top,
  };
};

export const useTheaterMode = ({
  dispatch,
}: UseTheaterModeProps) => {

  const positionPlayerRef = useRef<HTMLDivElement>(null);
  const playerWebTheaterMode = useExperiment(PlayerWebTheaterMode);
  const isMobile = useAppSelector(isMobileDeviceSelector);

  useEffect(() => {
    if (!isMobile) {
      playerWebTheaterMode.logExposure();
    }
  }, [playerWebTheaterMode, isMobile]);

  const isTheater = useAppSelector(isInTheaterModeSelector);
  const [showMetaInTheaterMode, setShowMetaInTheaterMode] = useState(false);
  const showMetaInTheaterModeRef = useRef(showMetaInTheaterMode);
  showMetaInTheaterModeRef.current = showMetaInTheaterMode;
  const isTheaterRef = useRef(isTheater);
  isTheaterRef.current = isTheater;
  const [stickyDistance, setStickyDistance] = useState(0);
  const stickyDistanceRef = useRef(stickyDistance);
  stickyDistanceRef.current = stickyDistance;

  const clickMoreDetail = useCallback(() => {
    const stickyScrollY = stickyDistanceRef.current;
    const playerWrapper = positionPlayerRef.current;
    if (playerWrapper) {
      playerWrapper.style.position = 'absolute';
      playerWrapper.style['margin-top'] = `${stickyScrollY}px`;
    }
    window.scrollBy({
      top: window.innerHeight - THEATER_MODE_TOP_HEIGHT,
      behavior: 'smooth',
    });
  }, [positionPlayerRef]);

  // remove all inline styles for theater mode
  const resetPlayerPositionInTheaterMode = useCallback(() => {
    const positionPlayer = positionPlayerRef.current;
    if (positionPlayer) {
      positionPlayer.style.position = '';
      positionPlayer.style['margin-top'] = '';
      positionPlayer.style.width = '';
      positionPlayer.style.height = '';
      positionPlayer.style.left = '';
      positionPlayer.style.top = '';
    }
  }, []);

  const handleScrollInTheaterMode = useCallback(() => {
    // hide/show more-detail-bottom
    if (scrollY > 0 && showMetaInTheaterModeRef.current === false) {
      setShowMetaInTheaterMode(true);
    } else if (scrollY <= 0 && showMetaInTheaterModeRef.current === true) {
      setShowMetaInTheaterMode(false);
    }

    const stickyScrollY = stickyDistanceRef.current;
    const playerWrapper = positionPlayerRef.current;
    if (playerWrapper) {
      // sticky/scroll player
      if (window.scrollY > stickyScrollY && playerWrapper.style.position !== 'absolute') {
        playerWrapper.style.position = 'absolute';
        playerWrapper.style['margin-top'] = `${stickyScrollY}px`;
      } else if (window.scrollY < stickyScrollY && playerWrapper.style.position !== 'sticky') {
        playerWrapper.style.position = 'sticky';
        playerWrapper.style['margin-top'] = 0;
      }
    }
  }, []);

  // centralize the player area in theater mode
  const setPlayerPositionInTheaterMode = useCallback(() => {
    const innerWidth = document.body.clientWidth;
    const innerHeight = window.innerHeight;
    const { top, height } = getTheaterPlayerPosition({ innerWidth, innerHeight });
    const distance = top - THEATER_MODE_TOP_HEIGHT + THEATER_MODE_BOTTOM_HEIGHT - THEATER_MODE_PLAYER_STICKY_DISTANCE;
    setStickyDistance(distance);

    const positionPlayer = positionPlayerRef.current;
    if (!positionPlayer) {
      return;
    }
    positionPlayer.style.transition = 'width, left, top .5s ease';
    positionPlayer.style.width = '100vw';
    positionPlayer.style.height = `${height}px`;
    positionPlayer.style.left = '0px';
    positionPlayer.style.top = `${top}px`;
  }, []);

  const handleScrollInTheaterModeRef = useRef(handleScrollInTheaterMode);
  handleScrollInTheaterModeRef.current = handleScrollInTheaterMode;
  const setPlayerPositionInTheaterModeRef = useRef(setPlayerPositionInTheaterMode);
  setPlayerPositionInTheaterModeRef.current = setPlayerPositionInTheaterMode;
  const resetPlayerPositionInTheaterModeRef = useRef(resetPlayerPositionInTheaterMode);
  resetPlayerPositionInTheaterModeRef.current = resetPlayerPositionInTheaterMode;

  useEffect(() => {
    const throttleHandleScrollInTheaterMode = throttle(handleScrollInTheaterModeRef.current, 50);
    const throttleSetPlayerPositionInTheaterMode = throttle(setPlayerPositionInTheaterModeRef.current, 50);

    if (__CLIENT__ && isTheater) {
      // show topNav in theater mode
      dispatch(setTopNavVisibleState(true));
      setShowMetaInTheaterMode(isTheaterRef.current && scrollY > 0);
      throttleSetPlayerPositionInTheaterMode();
      addEventListener(window, 'scroll', throttleHandleScrollInTheaterMode);
      addEventListener(window, 'resize', throttleSetPlayerPositionInTheaterMode);
    }
    return () => {
      resetPlayerPositionInTheaterModeRef.current();
      removeEventListener(window, 'scroll', throttleHandleScrollInTheaterMode);
      removeEventListener(window, 'resize', throttleSetPlayerPositionInTheaterMode);
    };

  }, [isTheater, dispatch]);

  return {
    isTheater,
    showMetaInTheaterMode,
    clickMoreDetail,
    positionPlayerRef,
  };
};
