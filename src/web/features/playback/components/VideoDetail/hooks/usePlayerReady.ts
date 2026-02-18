import { PLAYER_EVENTS } from '@adrise/player';
import { useCallback, useEffect, useState } from 'react';

import { isCrawler } from 'client/utils/isCrawler';
import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';
import usePlayerEvent from 'common/features/playback/hooks/usePlayerEvent';
import useLatest from 'common/hooks/useLatest';

export function usePlayerReady() {
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useLatest(useGetPlayerInstance());

  /**
   * Render the video element immediately for crawlers
   * or when the player already exists for the case when
   * we return to same video page when in-app pip player is active
   */
  useEffect(() => {
    if (isCrawler() || !!playerRef.current.getPlayerInstance()) {
      setPlayerReady(true);
    }
  }, [playerRef]);

  const onPlayerReady = useCallback(() => {
    setPlayerReady(true);
  }, []);

  usePlayerEvent(PLAYER_EVENTS.setup, onPlayerReady, { once: true, disable: playerReady });

  // To handle setting player ready when returning to the same video page when in the player portal
  usePlayerEvent(PLAYER_EVENTS.time, onPlayerReady, { once: true, disable: playerReady });

  usePlayerEvent(PLAYER_EVENTS.adTime, onPlayerReady, { once: true, disable: playerReady });

  return playerReady;
}
