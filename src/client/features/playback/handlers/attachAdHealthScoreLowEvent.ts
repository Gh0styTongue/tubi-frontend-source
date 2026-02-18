import type { AdHealthScoreLowEventData, Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';

import { trackAdHealthScoreLow } from 'client/features/playback/track/client-log/trackAdHealthScoreLow';
import { getExperiment } from 'common/experimentV2';
import { getPlatformHealthScoreExperiment } from 'common/experimentV2/configs/helpers/getPlatformHealthScoreExperiment';
import { webottMajorPlatformsAdHealthscoreR1 } from 'common/experimentV2/configs/webottMajorPlatformsAdHealthscoreR1';

import { setUse480pAds } from '../utils/use480pAds';

export function attachAdHealthScoreLowEvent(player: Player) {
  const onHealthScoreLow = (event: AdHealthScoreLowEventData) => {
    if (event.reason === 'healthscoreLow') {
      setUse480pAds(true);
    }
    trackAdHealthScoreLow({ event });
    const platformExperiment = getPlatformHealthScoreExperiment(__OTTPLATFORM__);
    if (platformExperiment) {
      getExperiment(platformExperiment).get('healthscore_skip_threshold');
    }
    getExperiment(webottMajorPlatformsAdHealthscoreR1);
  };
  player.on(PLAYER_EVENTS.adHealthScoreLow, onHealthScoreLow);

  return () => {
    player.removeListener(PLAYER_EVENTS.adHealthScoreLow, onHealthScoreLow);
  };
}
