import type { Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';

import type { Experiment } from 'common/experiments/Experiment';

export function attachAdHealthScoreLowEvent(player: InstanceType<typeof Player>, experiment?: Experiment) {
  const onHealthScoreLow = () => {
    experiment?.logExposure();
  };
  player.on(PLAYER_EVENTS.adHealthScoreLow, onHealthScoreLow);

  return () => {
    player.removeListener(PLAYER_EVENTS.adHealthScoreLow, onHealthScoreLow);
  };
}
