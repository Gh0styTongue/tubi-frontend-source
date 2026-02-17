import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackLivePauseRetry(
  { contentId, position }: { contentId: string, position: number },
): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LIVE_PAUSE_RETRY,
    message: {
      content_id: contentId,
      position,
    },
  });
}
