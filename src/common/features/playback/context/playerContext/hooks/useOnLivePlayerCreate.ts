import { useLayoutEffect, useRef } from 'react';

import type { LivePlayerManagers, LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';
import { usePlayerContext } from 'common/features/playback/context/playerContext/playerContext';

type CleanupFn = () => void;
type UseOnLivePlayerCreateCallback = (player: LivePlayerWrapper, managers: LivePlayerManagers) => CleanupFn | undefined;

/**
 * Allows the caller to pass a callback which will be invoked when the
 * player is ready. The callback may return a cleanup function
 *
 * Intended usage:
 * useOnLivePlayerCreate(useCallback((player, managers) => {
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
export function useOnLivePlayerCreate(callback: UseOnLivePlayerCreateCallback): void {
  const playerContext = usePlayerContext();
  const cleanupRef = useRef<CleanupFn | void>();

  /**
   * We prefer `useLayoutEffect` to `useEffect` because this ensures the callback
   * is subscribed _prior_ to children invoking useEffect.
   */
  useLayoutEffect(() => {
    const wrappedCallback = (player: LivePlayerWrapper, managers: LivePlayerManagers) => {
      cleanupRef.current?.();
      cleanupRef.current = callback(player, managers);
    };

    if (playerContext.livePlayer && playerContext.liveManagers) {
      wrappedCallback(playerContext.livePlayer, playerContext.liveManagers);
    }

    // Always subscribe to player creation events, even if we already ran the
    // callback. This is necessary because even if the player was ready on mount
    // it's possible for the player to be re-created
    playerContext.onLivePlayerCreate(wrappedCallback);

    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      playerContext.offLivePlayerCreate(wrappedCallback);
    };
  }, [callback, playerContext]);
}
