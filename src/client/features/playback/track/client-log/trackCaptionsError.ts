import { CAPTIONS_LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackCaptionsError({ errorMessage }: { errorMessage: string }) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: CAPTIONS_LOG_SUB_TYPE.CAPTIONS_ERROR,
    message: { errorMessage },
  });
}
