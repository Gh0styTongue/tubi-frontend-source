import Analytics from '@tubitv/analytics';
import type { PlayerDisplayMode } from '@tubitv/analytics/lib/playerEvent';

import { TRACK_LOGGING, LOG_SUB_TYPE } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackPreviewStall(
  { contentId, ...rest }: {
    contentId: string;
    videoPlayerState: PlayerDisplayMode;
    isMuted: boolean;
  },
) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.PREVIEW_STALL,
    message: {
      content_id: contentId,
      release: Analytics.getAnalyticsConfig().app_version,
      ...rest,
    },
  });
}
