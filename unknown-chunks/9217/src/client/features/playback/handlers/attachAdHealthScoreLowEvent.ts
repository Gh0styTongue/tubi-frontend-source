import type { AdHealthScoreLowEventData, Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';

import { trackAdHealthScoreLow } from 'client/features/playback/track/client-log/trackAdHealthScoreLow';
import type { Experiment } from 'common/experiments/Experiment';
import { skipAdByHealthScoreExpName } from 'common/selectors/experiments/skipAdByHealthscoreSelector';
export function attachAdHealthScoreLowEvent(player: Player, youboraExperimentMap?: { [name: string]: Experiment }) {
  const experiment = youboraExperimentMap?.[skipAdByHealthScoreExpName];
  const onHealthScoreLow = (event: AdHealthScoreLowEventData) => {
    trackAdHealthScoreLow({ event });
    experiment?.logExposure();
  };
  player.on(PLAYER_EVENTS.adHealthScoreLow, onHealthScoreLow);

  return () => {
    player.removeListener(PLAYER_EVENTS.adHealthScoreLow, onHealthScoreLow);
  };
}
