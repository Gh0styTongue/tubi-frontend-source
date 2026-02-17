import type { Player } from '@adrise/player';
import { PLAYER_EVENTS } from '@adrise/player';

import { exposeToTubiGlobal } from 'client/global';
import { FREEZED_EMPTY_FUNCTION } from 'common/constants/constants';

export function attachStartupPerformanceExpose(player: InstanceType<typeof Player>) {
  if (!__IS_E2E_TEST__) {
    return FREEZED_EMPTY_FUNCTION;
  }
  const onStartupPerformance = ({ metrics }: { metrics: any}) => {
    exposeToTubiGlobal({
      playbackE2EMetric: {
        ...(window.Tubi?.playbackE2EMetric || {}),
        [Date.now()]: metrics,
      },
    });
  };
  player.on(PLAYER_EVENTS.startupPerformance, onStartupPerformance);

  return () => {
    player.removeListener(PLAYER_EVENTS.startupPerformance, onStartupPerformance);
  };
}
