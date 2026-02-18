import { PLAYBACK_LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

interface AutoStartCapabilityEvent {
  muted: boolean;
  canPlay: boolean;
}

export function trackAutoStartCapability(message: AutoStartCapabilityEvent): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: PLAYBACK_LOG_SUB_TYPE.AUTO_START_CAPABILITY,
    message_map: {
      muted: String(message.muted),
      canPlay: String(message.canPlay),
    },
  });
}
