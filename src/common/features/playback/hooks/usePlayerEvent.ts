import type { PlayerListeners, PLAYER_EVENTS } from '@adrise/player';
import { useCallback } from 'react';

import { useOnDecoupledPlayerCreate } from '../context/playerContext/hooks/useOnDecoupledPlayerCreate';
import { useOnPlayerCreate } from '../context/playerContext/hooks/useOnPlayerCreate';

type EventListener<E> = E extends keyof PlayerListeners
  ? PlayerListeners[E]
  : (...args: any[]) => void;

/**
 * Options for configuring player event handling behavior.
 *
 * Example use case:
 * ```tsx
 * const [isOverlayOpen, setIsOverlayOpen] = useState(false);
 * usePlayerEvent(PLAYER_EVENTS.time, onTimeUpdate, {
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

function usePlayerEventInternal<E extends PLAYER_EVENTS>(
  event: E,
  listener: EventListener<E>,
  options: UsePlayerEventOptions = {},
  decoupled: boolean,
) {
  const { disable = false, once = false } = options;
  const usePlayerCreateHook = decoupled ? useOnDecoupledPlayerCreate : useOnPlayerCreate;

  usePlayerCreateHook(useCallback((player) => {
    if (disable) return;
    const method = once ? 'once' : 'on';

    player[method](event, listener);
    return () => {
      player.off(event, listener);
    };
  }, [disable, event, listener, once]));
}

function usePlayerEvent<E extends PLAYER_EVENTS>(
  event: E,
  listener: EventListener<E>,
  options?: UsePlayerEventOptions,
) {
  return usePlayerEventInternal(event, listener, options, false);
}

function useDecoupledPlayerEvent<E extends PLAYER_EVENTS>(
  event: E,
  listener: EventListener<E>,
  options?: UsePlayerEventOptions,
) {
  return usePlayerEventInternal(event, listener, options, true);
}

export default usePlayerEvent;
export { useDecoupledPlayerEvent };
