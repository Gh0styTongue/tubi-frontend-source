import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import type { PlayerType } from './utils/types';

interface ComponentRerenderEntry {
  // how many times the component rerendered
  rc: number;
  // renders per second
  rps: number;
}

interface TrackPlayerUiPerf {
  // general
  sessionLengthSec: number;

  // time update monitor
  timeupdatesAverage: number
  slowTimeupdateRatio: number
  timeupdatesOverOneSecond: number
  timeupdatesUnderOneSecond: number

  // rerender stats
  // the key is the component name
  rerenderCount: Record<string, ComponentRerenderEntry>;
  playerType: PlayerType;
}

export function trackPlayerUiPerf(context: TrackPlayerUiPerf): void {
  trackLogging({
    level: 'info',
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.PLAYER_UI_PERF,
    message: {
      ...context,
    },
  });
}
