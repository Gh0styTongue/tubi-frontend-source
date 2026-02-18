import { PLAYER_EVENTS } from '@adrise/player';
import { useEffect } from 'react';

import { useGetPlayerInstance } from 'common/features/playback/context/playerContext/hooks/useGetPlayerInstance';

/**
 * This hook is used to ensure the player continues playing when the player
 * is placed into in-app pip mode upon the navigating away from the VideoDetail
 * page.
 *
 * It has been observed that the browser may pause the video playback when the video
 * element is moved within the DOM. The reason behind this is not clear, but tracing
 * the pause event reveals that the browser is the source of the pause.
 */
export function useAutoplayFloatingPlayer(isFloating: boolean) {
  const { getPlayerInstance } = useGetPlayerInstance();

  useEffect(() => {
    const player = getPlayerInstance();
    if (!player || !isFloating) return;

    /**
     * Play the player when the initial pause event is triggered after
     * the player is placed into in-app pip mode.
     */
    const onPause = () => player.play();
    player.once(PLAYER_EVENTS.pause, onPause);
    player.once(PLAYER_EVENTS.adPause, onPause);

    /**
     * Remove the event listeners if no pause or adPause events are triggered
     * after the player is placed into in-app pip mode, and time events are
     * emitting as expected.
     */
    const onTime = () => {
      player.removeListener(PLAYER_EVENTS.pause, onPause);
      player.removeListener(PLAYER_EVENTS.adPause, onPause);
      player.removeListener(PLAYER_EVENTS.time, onTime);
      player.removeListener(PLAYER_EVENTS.adTime, onTime);
    };
    player.once(PLAYER_EVENTS.time, onTime);
    player.once(PLAYER_EVENTS.adTime, onTime);

    return () => {
      player.removeListener(PLAYER_EVENTS.pause, onPause);
      player.removeListener(PLAYER_EVENTS.adPause, onPause);
      player.removeListener(PLAYER_EVENTS.time, onTime);
      player.removeListener(PLAYER_EVENTS.adTime, onTime);
    };
  }, [isFloating, getPlayerInstance]);
}
