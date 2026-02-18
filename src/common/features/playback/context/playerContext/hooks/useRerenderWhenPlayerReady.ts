import type { Player } from '@adrise/player';
import { useCallback, useState } from 'react';

import { useOnPlayerCreate } from 'common/features/playback/context/playerContext/hooks/useOnPlayerCreate';

/**
 * This hook is intended to allow access to a _possible_ instance of the player
 * It rerenders the called when the player is ready.
 *
 * You are *strongly* advised to avoid using this hook, if you can-- almost
 * everything we need to do with the player we can accomplish in some way that
 * relies on subscriptions rather than re-renders, because React rerenders impose a
 * performance cost that is usually avoidable
 */
export const useRerenderWhenPlayerReady = () => {
  const [player, setPlayer] = useState<Player | undefined>();
  useOnPlayerCreate(useCallback((player: Player) => {
    setPlayer(player);
    return () => {
      setPlayer(undefined);
    };
  }, []));

  return { player };
};
