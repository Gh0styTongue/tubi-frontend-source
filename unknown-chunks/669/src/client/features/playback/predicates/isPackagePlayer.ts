/* istanbul ignore file */
import type { Player } from '@adrise/player';
import { PlayerName } from '@adrise/player';

import type { LivePlayerWrapper } from '../live/LivePlayerWrapper';

export function isPackagePlayer(x: Partial<Player | LivePlayerWrapper>): x is Player {
  return typeof x.playerName !== 'undefined' && x.playerName !== PlayerName.Linear;
}
