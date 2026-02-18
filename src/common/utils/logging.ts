import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';
/**
 * Track mobile play button clicks on mobile web by using the logging API.
 * There is no support for this in the new analytics design.
 * @param id
 * @param title
 */
export const trackMobilePlayButtonClick = (id: string, title: string): void => {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.WEB_MOBILE_PLAY_BUTTON,
    message: {
      id,
      title,
    },
  });
};
