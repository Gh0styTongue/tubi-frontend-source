import { PLAYER_EVENTS } from '@adrise/player';
import { useCallback, useRef } from 'react';

import useLivePlayerEvent from './useLivePlayerEvent';
import usePlayerEvent from './usePlayerEvent';
import { useOnLivePlayerCreate } from '../context/playerContext/hooks/useOnLivePlayerCreate';
import { useOnPlayerCreate } from '../context/playerContext/hooks/useOnPlayerCreate';

export function useGetTotalViewTime() {
  const totalViewTimeRef = useRef(0);
  const previousPositionRef = useRef(0);

  const onPlayerCreate = useCallback(() => {
    totalViewTimeRef.current = 0;
    previousPositionRef.current = 0;
    return () => {
      totalViewTimeRef.current = 0;
      previousPositionRef.current = 0;
    };
  }, []);

  const onTime = useCallback(({ position }: { position: number }) => {
    const nowPosition = Math.floor(position);
    if (previousPositionRef.current !== nowPosition) {
      previousPositionRef.current = nowPosition;
      totalViewTimeRef.current++;
    }
  }, []);

  useOnPlayerCreate(onPlayerCreate);
  usePlayerEvent(PLAYER_EVENTS.time, onTime);

  useOnLivePlayerCreate(onPlayerCreate);
  useLivePlayerEvent(PLAYER_EVENTS.time, onTime);

  const getTotalViewTime = useCallback(() => {
    return totalViewTimeRef.current;
  }, []);

  return { getTotalViewTime };
}
