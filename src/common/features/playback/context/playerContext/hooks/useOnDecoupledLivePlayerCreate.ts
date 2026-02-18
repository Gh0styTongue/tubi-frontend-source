import { useRef } from 'react';

import type { LivePlayerManagers, LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { usePlayerContext } from 'common/features/playback/context/playerContext/playerContext';
import { useIsomorphicLayoutEffect } from 'common/hooks/useIsomorphicLayoutEffect';

type CleanupFn = () => void;
type UseOnDecoupledLivePlayerCreateCallback = (player: LivePlayerWrapper, managers: LivePlayerManagers) => CleanupFn | undefined;

/**
 * Similar to useOnDecoupledPlayerCreate, this hook allows the caller to pass a callback
 * which will be invoked when the live player is created. The key difference is that
 * the returned cleanup function is invoked when the player is removed, rather
 * than when the hook unmounts. This is useful for handling any logic that only
 * needs to run when the player is removed, such as tracking metrics or cleaning
 * up resources. This will enable us to persist the player instance in the
 * player context beyond the lifetime of the component it was created in.
 *
 * Intended usage:
 * useOnDecoupledLivePlayerCreate(useCallback((player, managers) => {
 *    // store references to stable values at the time of player creation
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
export function useOnDecoupledLivePlayerCreate(callback: UseOnDecoupledLivePlayerCreateCallback): void {
  const playerContext = usePlayerContext();
  const cleanupRef = useRef<CleanupFn | void>();
  const callbackRef = useRef<UseOnDecoupledLivePlayerCreateCallback>(callback);

  /**
   * We prefer `useLayoutEffect` to `useEffect` because this ensures the callback
   * is subscribed _prior_ to children invoking useEffect.
   * We use useIsomorphicLayoutEffect to avoid SSR warnings.
   */
  useIsomorphicLayoutEffect(() => {
    if (callbackRef.current !== callback) {
      throw new Error(
        'useOnDecoupledLivePlayerCreate: callback must be memoized with useCallback to prevent re-subscription on every render'
      );
    }

    const wrappedCallback = (player: LivePlayerWrapper, managers: LivePlayerManagers) => {
      if (cleanupRef.current) {
        playerContext.offLivePlayerRemove(cleanupRef.current);
      }

      cleanupRef.current = callback(player, managers);
      if (cleanupRef.current) {
        playerContext.onLivePlayerRemove(cleanupRef.current);
      }
    };

    if (playerContext.livePlayer && playerContext.liveManagers) {
      wrappedCallback(playerContext.livePlayer, playerContext.liveManagers);
    }

    // Always subscribe to player creation events, even if we already ran the
    // callback. This is necessary because even if the player was ready on mount
    // it's possible for the player to be re-created
    playerContext.onLivePlayerCreate(wrappedCallback);

    const cleanupFn = cleanupRef.current;
    return () => {
      playerContext.offLivePlayerCreate(wrappedCallback);
      if (cleanupFn) {
        playerContext.offLivePlayerRemove(cleanupFn);
      }
    };
  }, [callback, playerContext]);
}
