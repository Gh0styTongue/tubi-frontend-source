import type { Player } from '@adrise/player';
import { useLayoutEffect, useRef } from 'react';

import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import { usePlayerContext } from 'web/features/playback/contexts/playerContext/playerContext';

type CleanupFn = () => void;
type UseOnPlayerCreateCallback = (player: Player, managers: PlayerManagers) => CleanupFn | void;

/**
 * Allows the caller to pass a callback which will be invoked when the
 * player is ready. The callback may return a cleanup function
 *
 * Intended usage:
 * useOnPlayerCreate(useCallback((player, managers) => {
 *    // setup logic
 *    return () => {
 *      // cleanup logic
 *    };
 * }, []))
 *
 * Note that you MUST memoize the callback, otherwise it will be re-subscribed
 * to the player on EVERY render.
 *
 * Why don't we just call `useCallback` internally and accept an argument for
 * the dependency array? If we do this, the react-hooks/exhausitive-deps rule
 * will not be able to detect the dependency array and will not be able to
 * lint it properly.
 *
 * TODO: solve this via forking and writing our own lint rule
 */
export function useOnPlayerCreate(callback: UseOnPlayerCreateCallback): void {
  const playerContext = usePlayerContext();
  const cleanupRef = useRef<CleanupFn | void>();

  /**
   * We prefer `useLayoutEffect` to `useEffect` because this ensures the callback
   * is subscribed _prior_ to children invoking useEffect.
   */
  useLayoutEffect(() => {
    const wrappedCallback = (player: Player, managers: PlayerManagers) => {
      cleanupRef.current = callback(player, managers);
    };
    playerContext.onPlayerCreate(wrappedCallback);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      playerContext.offPlayerCreate(wrappedCallback);
    };
  }, [callback, playerContext]);
}
