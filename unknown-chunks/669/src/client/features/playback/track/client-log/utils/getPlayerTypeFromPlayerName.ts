import { PlayerName } from '@adrise/player';

import { PlayerType } from './types';

export function getPlayerTypeFromPlayerName(name?: PlayerName): PlayerType {
  switch (name) {
    case PlayerName.Linear:
      return PlayerType.Linear;
    case PlayerName.Preview:
      return PlayerType.Preview;
    case PlayerName.Trailer:
      return PlayerType.Trailer;
    default:
      return PlayerType.VOD;
  }
}
