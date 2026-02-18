import { useCallback } from 'react';

import { usePlayerContext } from 'common/features/playback/context/playerContext/playerContext';
import useLatest from 'common/hooks/useLatest';

/**
 * This hook is intended to allow access to a _possible_ instance of the live player
 *
 * Prior to the live player existing, this will return undefined. If you need
 * guaranteed access to the live player (e.g. if the caller needs to be notified when
 * the live player is ready so it can--for example--subscribe to player events),
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
export function useGetLivePlayerInstance() {
  const playerContext = usePlayerContext();
  const playerContextRef = useLatest(playerContext);
  return {
    getLivePlayerInstance: useCallback(() => playerContextRef.current.livePlayer, [playerContextRef]),
  };
}
