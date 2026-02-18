import type { ErrorEventData } from '@adrise/player';
import Analytics from '@tubitv/analytics';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

import { convertErrorEventDataIntoErrorClientLog } from './utils/convertErrorEventDataIntoErrorClientLog';

export function trackPreviewError(
  error: ErrorEventData,
  { contentId, ...rest }: {
    contentId: string;
    videoPlayerState: PlayerDisplayMode;
    isMuted: boolean;
  },
) {
  // Let's limit to Web and Vizio first.
  /* istanbul ignore if */
  if (__WEBPLATFORM__ !== 'WEB' && __OTTPLATFORM__ !== 'VIZIO') return;
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.PREVIEW_ERROR,
    message: {
      ...convertErrorEventDataIntoErrorClientLog(error),
      content_id: contentId,
      release: Analytics.getAnalyticsConfig().app_version,
      ...rest,
    },
  });
}
