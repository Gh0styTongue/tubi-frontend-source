import type { ErrorEventData } from '@adrise/player';
import { now } from '@adrise/utils/lib/time';
import { useState, useEffect } from 'react';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';

export function useLivePlayerFrozenDetect({
  wrapper,
  playerError,
}: {
    wrapper: LivePlayerWrapper | null,
    playerError: ErrorEventData | null
  }) {
  const [isPlayerFrozen, setPlayerFrozen] = useState(false);
  useEffect(() => {
    if (!wrapper || !playerError) return;
    let position = wrapper.getPosition();
    let prevTimestamp = now();
    const gap = 500;
    const stalledTimer = setInterval(() => {
      const currentTimestamp = now();
      const timestampDelta = currentTimestamp - prevTimestamp;
      if (timestampDelta < gap - 1) return;
      prevTimestamp = currentTimestamp;
      const currentPosition = wrapper.getPosition();
      if (position === currentPosition) {
        setPlayerFrozen(true);
      }
      position = currentPosition;
    }, gap);
    return () => {
      clearInterval(stalledTimer);
      setPlayerFrozen(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerError?.type, wrapper]);
  return isPlayerFrozen;
}
