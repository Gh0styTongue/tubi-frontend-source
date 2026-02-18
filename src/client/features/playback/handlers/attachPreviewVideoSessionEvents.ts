import type { Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';

import { bufferEnd, bufferStart, complete, paused, playerReady, timeupdate } from '../session/PreviewVideoSession';

export const attachPreviewVideoSessionEvents = (player: InstanceType<typeof Player>) => {
  player.on(PLAYER_EVENTS.ready, playerReady);
  player.on(PLAYER_EVENTS.time, timeupdate);
  player.on(PLAYER_EVENTS.bufferStart, bufferStart);
  player.on(PLAYER_EVENTS.bufferEnd, bufferEnd);
  player.on(PLAYER_EVENTS.pause, paused);
  player.on(PLAYER_EVENTS.complete, complete);

  return () => {
    player.removeListener(PLAYER_EVENTS.ready, playerReady);
    player.removeListener(PLAYER_EVENTS.time, timeupdate);
    player.removeListener(PLAYER_EVENTS.bufferStart, bufferStart);
    player.removeListener(PLAYER_EVENTS.bufferEnd, bufferEnd);
    player.removeListener(PLAYER_EVENTS.pause, paused);
    player.removeListener(PLAYER_EVENTS.complete, complete);
  };
};
