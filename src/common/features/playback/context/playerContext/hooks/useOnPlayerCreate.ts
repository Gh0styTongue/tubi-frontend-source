import type { Player } from '@adrise/player';
import { useLayoutEffect, useRef } from 'react';

import type { PlayerManagers } from 'client/features/playback/tubiPlayer';
import { usePlayerContext } from 'common/features/playback/context/playerContext/playerContext';

export type CleanupFn = () => void;
export type UseOnPlayerCreateCallback = (player: Player, managers: PlayerManagers) => CleanupFn | undefined;

interface UseOnPlayerCreateOptions {
   // If true, the callback will be called on ASAP during the next DOM mutation
   // phase (after mutation but before paint, i.e. `useLayoutEffect`) if the
   // player has already been created. If false, the callback will be invoked
   // only when the player is created.
  runImmediately?: boolean;
}

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
export function useOnPlayerCreate(callback: UseOnPlayerCreateCallback, options: UseOnPlayerCreateOptions = {}): void {
  const playerContext = usePlayerContext();
  const cleanupRef = useRef<CleanupFn | undefined>();

  /**
   * We prefer `useLayoutEffect` to `useEffect` because this ensures the callback
   * is subscribed _prior_ to children invoking useEffect.
   */
  useLayoutEffect(() => {
    const wrappedCallback = (player: Player, managers: PlayerManagers) => {
      // Run any existing cleanup before setting up a new one
      cleanupRef.current?.();
      cleanupRef.current = callback(player, managers);
    };

    // Run immediately if requested and player already exists
    if (options.runImmediately && playerContext.player && playerContext.managers) {
      wrappedCallback(playerContext.player, playerContext.managers);
    }

    // Always subscribe to player creation events, even if we already ran the
    // callback. This is necessary because even if the player was ready on mount
    // it's possible for the player to be re-created
    playerContext.onPlayerCreate(wrappedCallback);

    // Always unsubscribe from player creation and run the cleanup, no matter
    // whether the callback was run on mount or not.
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      playerContext.offPlayerCreate(wrappedCallback);
    };
  }, [callback, playerContext, options.runImmediately]);
}
