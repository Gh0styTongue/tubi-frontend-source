import { useCallback } from 'react';

import { usePlayerContext } from 'web/features/playback/contexts/playerContext/playerContext';

/**
 * This hook is intended to allow access to a _possible_ instance of the player
 *
 * Prior to the player existing, this will return undefined. If you need
 * guaranteed access to the player (e.g. if the caller needs to be notified when
 * the player is ready so it can--for example--subscribe to player events),
 * do not use this hook.
 *
 * This hook is best suited for cases where the caller needs to query or call
 * a method on the player in response to some event which is very likely to
 * occur long after the player has been created. For example: the user needs
 * adjust the volume; we need to query and log some property of the player, etc.
 *
 * Please note that when the player becomes available, this hook does
 * not cause a re-render.
 */
export function useGetPlayerInstance() {
  const playerContext = usePlayerContext();
  return {
    getPlayerInstance: useCallback(() => playerContext.player, [playerContext]),
  };
}
