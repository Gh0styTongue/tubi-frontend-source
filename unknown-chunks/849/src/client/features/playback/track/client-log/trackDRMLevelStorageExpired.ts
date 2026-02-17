import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackDRMLevelStorageExpired(savedLevel: any): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.DRM_LEVEL_STORAGE_EXPIRED,
    message: {
      content: savedLevel,
    },
  });
}
