import { useCallback } from 'react';

import { usePlayerContext } from 'common/features/playback/context/playerContext/playerContext';
import useLatest from 'common/hooks/useLatest';

/**
 * This hook is intended to allow access to a _possible_ instance of the player managers
 *
 * Prior to the player existing, this will return undefined. If you need
 * guaranteed access to the player managers (e.g. if the caller needs to be notified when
 * the player managers are ready, etc.),
 * do not use this hook.
 *
 * Please note that when the player managers become available, this hook does
 * not cause a re-render.
 */
export function useGetPlayerManagers() {
  const playerContext = usePlayerContext();
  const playerContextRef = useLatest(playerContext);

  return {
    getPlayerManagers: useCallback(() => playerContextRef.current.managers, [playerContextRef]),
  };
}
