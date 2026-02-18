import { PLAYER_EVENTS } from '@adrise/player';
import { useCallback, useState } from 'react';

import { VIDEO_REG_GATE_TIME_THRESHOLD } from 'common/constants/player';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';

export const useVideoProgressRegistrationGate = (enabled: boolean) => {
  const { getPlayerInstance } = useGetPlayerInstance();
  const [shouldShowGate, setShouldShowGate] = useState(false);

  const checkTimeAndPauseIfNeeded = useCallback(() => {
    // Skip if not enabled
    if (!enabled) return;

    const player = getPlayerInstance();
    /* istanbul ignore next */
    if (!player) return;

    const currentTime = player.getPosition();

    if (currentTime >= VIDEO_REG_GATE_TIME_THRESHOLD) {
      setShouldShowGate(true);
      player.pause();
    }
  }, [enabled, getPlayerInstance]);

  usePlayerEvent(PLAYER_EVENTS.play, checkTimeAndPauseIfNeeded);
  usePlayerEvent(PLAYER_EVENTS.time, checkTimeAndPauseIfNeeded);

  return { shouldShowGate };
};

