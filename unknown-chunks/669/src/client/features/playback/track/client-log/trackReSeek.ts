import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackReSeek({
  targetPosition,
  position,
}: {
  targetPosition: number;
  position: number;
}): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    level: 'info',
    subtype: LOG_SUB_TYPE.PLAYBACK.RE_SEEK,
    message: `Re-Seek performed. Seek to ${targetPosition}, but restart to ${position}`,
  });
}
