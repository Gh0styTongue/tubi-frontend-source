import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

interface TrackTimeupdateStats {
  average: number
  slowTimeupdateRatio: number
  updatesOverOneSecond: number
  updatesUnderOneSecond: number
}

export function trackTimeupdateStats(context: TrackTimeupdateStats): void {
  trackLogging({
    level: 'info',
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.TIMEUPDATE_STATS,
    message: {
      ...context,
    },
  });
}
