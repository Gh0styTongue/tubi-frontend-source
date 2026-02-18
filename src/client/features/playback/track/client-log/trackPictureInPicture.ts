import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackEnterPictureInPicture(contentId: string) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.ENTER_PICTURE_IN_PICTURE,
    message: {
      content_id: contentId,
    },
  });
}

export function trackEnterPictureInPictureError(contentId: string, error: string) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.ENTER_PICTURE_IN_PICTURE_ERROR,
    message: {
      content_id: contentId,
      error,
    },
  });
}

export function trackLeavePictureInPicture(contentId: string) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LEAVE_PICTURE_IN_PICTURE,
    message: {
      content_id: contentId,
    },
  });
}

export function trackLeavePictureInPictureError(contentId: string, error: string) {
  trackLogging({
    type: TRACK_LOGGING.videoInfo,
    subtype: LOG_SUB_TYPE.PLAYBACK.LEAVE_PICTURE_IN_PICTURE_ERROR,
    message: {
      content_id: contentId,
      error,
    },
  });
}
