import { PLAYER_EVENTS, State as PLAYER_STATES } from '@adrise/player';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';
import useAppSelector from 'common/hooks/useAppSelector';
import useLatest from 'common/hooks/useLatest';
import { isAdSelector, playerStateSelector } from 'common/selectors/playerStore';

export const RATING_SHOWN_DURATION_MILLISECONDS = 15000;
export const SHOWN_RATING_IN_PLAY_DURATION_MILLISECONDS = 3600000;

const useRatingOverlay = () => {
  const isAd = useAppSelector(isAdSelector);
  const isAdRef = useLatest(isAd);
  const playerState = useAppSelector(playerStateSelector);
  const playerStateRef = useLatest(playerState);
  const [ratingActive, setRatingActive] = useState(false);
  const [allowRatingDisplayStart, setAllowRatingDisplayStart] = useState(true);
  const allowRatingDisplayStartRef = useLatest(allowRatingDisplayStart);

  const hideRatingActiveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const showRatingDuringPlaybackTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const unblockRatingDisplay = useCallback(() => {
    setAllowRatingDisplayStart(true);
  }, []);

  const onAdStart = useCallback(() => {
    setRatingActive(false);
  }, []);

  /**
   * The RatingOverlay will show at some cases:
   * 1. When Video is first play (skip pre-roll Ad)
   * 2. After an Ad is finished
   * 3. An hour later since the last RatingOverlay show (skip pause state and Ad)
   *
   * allowRatingDisplay will filter out invocations on invalid play events
   */
  const showRatingOverlay = useCallback(() => {
    if (!allowRatingDisplayStartRef.current) return;
    if (isAdRef.current) return;
    if (![PLAYER_STATES.playing, PLAYER_STATES.inited].includes(playerStateRef.current)) return;
    setRatingActive(true);
    setAllowRatingDisplayStart(false);

    clearTimeout(hideRatingActiveTimerRef.current);

    const setRatingShowInPlayTimer = () => {
      clearTimeout(showRatingDuringPlaybackTimerRef.current);

      showRatingDuringPlaybackTimerRef.current = setTimeout(() => {
        unblockRatingDisplay();
        showRatingOverlay();
      }, SHOWN_RATING_IN_PLAY_DURATION_MILLISECONDS);
    };

    hideRatingActiveTimerRef.current = setTimeout(() => {
      setRatingActive(false);
      setRatingShowInPlayTimer();
    }, RATING_SHOWN_DURATION_MILLISECONDS);
  }, [
    unblockRatingDisplay,
    allowRatingDisplayStartRef,
    isAdRef,
    playerStateRef,
  ]);

  useOnPlayerCreate(useCallback((player) => {
    player.on(PLAYER_EVENTS.play, showRatingOverlay);
    player.on(PLAYER_EVENTS.adStart, onAdStart);
    player.on(PLAYER_EVENTS.adComplete, unblockRatingDisplay);

    return () => {
      player.off(PLAYER_EVENTS.play, showRatingOverlay);
      player.off(PLAYER_EVENTS.adStart, onAdStart);
      player.off(PLAYER_EVENTS.adComplete, unblockRatingDisplay);
    };
  }, [
    showRatingOverlay,
    onAdStart,
    unblockRatingDisplay,
  ]));

  useEffect(() => {
    return () => {
      clearTimeout(hideRatingActiveTimerRef.current);
      clearTimeout(showRatingDuringPlaybackTimerRef.current);
    };
  }, []);

  return {
    ratingActive,

    // exposed for testing only
    allowRatingDisplayStart,
    setAllowRatingDisplayStart,
  };
};

export default useRatingOverlay;
