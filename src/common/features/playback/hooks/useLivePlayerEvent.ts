import type { PLAYER_EVENTS } from '@adrise/player';
import { useCallback } from 'react';

import type { LivePlayerListeners } from 'client/features/playback/live/types';
import { useOnLivePlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnLivePlayerCreate';

type EventListener<E> = E extends keyof LivePlayerListeners
    ? LivePlayerListeners[E]
    : (...args: unknown[]) => void;

/**
 * Options for configuring live player event handling behavior.
 *
 * Example use case:
 * ```tsx
 * const [isOverlayOpen, setIsOverlayOpen] = useState(false);
 * useLivePlayerEvent(PLAYER_EVENTS.time, onTimeUpdate, {
 *   disable: isOverlayOpen,
 * });
 * ```
 */
interface UsePlayerEventOptions {
  /**
   * When true, prevents the event listener from being attached.
   */
  disable?: boolean;
  /**
   * When true, uses player.once() instead of player.on().
   */
  once?: boolean;
}

function useLivePlayerEvent<E extends PLAYER_EVENTS>(
  event: E,
  listener: EventListener<E>,
  options: UsePlayerEventOptions = {},
) {
  const { disable = false, once = false } = options;

  useOnLivePlayerCreate(useCallback((player) => {
    if (disable) return;
    const method = once ? 'once' : 'on';

    player[method](event, listener);
    return () => {
      player.off(event, listener);
    };
  }, [disable, event, listener, once]));
}

export default useLivePlayerEvent;
