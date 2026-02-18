import { useCallback } from 'react';

import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';

export function useRemovePlayer() {
  const { getPlayerInstance } = useGetPlayerInstance();

  /**
   * Destroys the player instance
   */
  const removePlayer = useCallback(() => {
    const player = getPlayerInstance();
    if (player) {
      player.remove();
    }

  }, [getPlayerInstance]);

  return removePlayer;
}
