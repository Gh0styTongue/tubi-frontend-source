import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import type { VideoResourceLevel } from 'common/features/playback/services/VideoResourceManager';
import { trackLogging } from 'common/utils/track';

export function trackInvalidCDNResource(levels: VideoResourceLevel[]): void {
  // Only pickup necessary fields, or the message will be truncated
  const data = levels.map(level => {
    const { drm, hdcp, resources } = level;
    return {
      drm,
      hdcp,
      resources: resources.map(resource => {
        const { type, codec, resolution } = resource;
        return {
          type,
          codec,
          resolution,
        };
      }),
    };
  });
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.INVALID_CDN_RESOURCE,
    message: {
      content: levels[0]?.resources[0]?.manifest.url,
      resouces: data,
    },
  });
}
