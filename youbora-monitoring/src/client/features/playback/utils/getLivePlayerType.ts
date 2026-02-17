import type { Player } from '@adrise/player';

import type { LivePlayerWrapper } from 'client/features/playback/live/LivePlayerWrapper';

export function getLivePlayerWrapperFromYoubora(youboraThis: {
  player: LivePlayerWrapper | Player
}): LivePlayerWrapper | undefined {
  return isLivePlayer(youboraThis.player) ? youboraThis.player : undefined;
}

export function isLivePlayer(player: Player | LivePlayerWrapper | undefined): player is LivePlayerWrapper {
  if (!player) return false;
  return (player as { isLivePlayer?: boolean }).isLivePlayer === true;
}
