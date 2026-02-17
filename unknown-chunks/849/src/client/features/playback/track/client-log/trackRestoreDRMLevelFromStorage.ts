import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import type { DrmLevel } from 'common/features/playback/services/VideoResourceManager';
import { trackLogging } from 'common/utils/track';

export function trackRestoreDRMLevelFromStorage(level: DrmLevel): void {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.RESTORE_DRM_LEVEL_FROM_STORAGE,
    message: {
      drm: level.drm,
      hdcp: level.hdcp,
    },
  });
}
