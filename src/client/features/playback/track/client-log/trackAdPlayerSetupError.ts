import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackAdPlayerSetupError(
  error: Error,
) {
  trackLogging({
    type: TRACK_LOGGING.adInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.AD_PLAYER_SETUP_ERROR,
    message: {
      message: error.message,
    },
  });
}

