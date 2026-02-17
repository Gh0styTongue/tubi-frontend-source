import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import type { ResumeBeginningAfterAdEvent } from '../../services/ResumeBeginningAfterAdManager';

export function trackResumeBeginningAfterAd(event: ResumeBeginningAfterAdEvent) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.RESUME_BEGINNING_AFTER_AD,
    message: event,
  });
}
