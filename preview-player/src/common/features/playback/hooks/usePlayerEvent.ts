import type { Player, PlayerListeners, PLAYER_EVENTS } from '@adrise/player';
import { useEffect } from 'react';

type EventListener<E> = E extends keyof PlayerListeners ? PlayerListeners[E] : (...args: any[]) => void;

interface UsePlayerEventOptions {
  disable?: boolean;
  once?: boolean;
}

function usePlayerEvent<E extends PLAYER_EVENTS>(event: E, listener: EventListener<E>, player?: Player, options: UsePlayerEventOptions = {}) {
  const { disable = false, once = false } = options;
  useEffect(() => {
    if (disable) return;
    const method = once ? 'once' : 'on';
    player?.[method](event, listener);
    return () => {
      player?.off(event, listener);
    };
  }, [player, event, listener, disable, once]);
}

export default usePlayerEvent;
