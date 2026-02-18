import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackInAppPipAutoPause({
  isAd,
  contentId,
  isPaused,
}: {
  isAd: boolean;
  contentId?: string;
  isPaused?: boolean;
}) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.IN_APP_PIP_AUTO_PAUSE,
    message: {
      is_ad: isAd,
      content_id: contentId,
      is_paused: isPaused,
    },
  });
}
