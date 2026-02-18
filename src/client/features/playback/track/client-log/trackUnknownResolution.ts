import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackUnknownResolution(contentId: string, width: number, height: number) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.UNKNOWN_RESOLUTION,
    message: {
      content_id: contentId,
      width,
      height,
    },
  });
}
