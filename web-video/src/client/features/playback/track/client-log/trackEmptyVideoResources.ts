import type { DrmKeySystem } from '@adrise/player';

import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackEmptyVideoResources(
  message: {
    content_id: string,
    showDRMUnsupportedWarning: boolean,
    drmKeySystem: DrmKeySystem | undefined,
    isDRMSupported: boolean,
    track_id: string,
  },
) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.EMPTY_VIDEO_RESOURCE,
    message,
  });
}
