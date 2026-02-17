import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackSeekRestart({
  targetPosition,
  position,
}: {
  targetPosition: number;
  position: number;
}): void {
  trackLogging({
    type: TRACK_LOGGING.videoPlayback,
    level: 'error',
    subtype: LOG_SUB_TYPE.PLAYBACK.RE_START,
    message: `Re-seek failed. Seek to ${targetPosition}, but restart to ${position}`,
  });
}
