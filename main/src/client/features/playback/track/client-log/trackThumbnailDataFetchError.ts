import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

interface TrackThumbnailDataFetchError {
  error: unknown
}

export function trackThumbnailDataFetchError(context: TrackThumbnailDataFetchError): void {
  let errorString: string;
  if (context.error instanceof Error) {
    errorString = context.error.toString();
  } else {
    errorString = String(context.error);
  }

  trackLogging({
    level: 'info',
    type: TRACK_LOGGING.clientInfo,
    subtype: LOG_SUB_TYPE.THUMBNAILS.DATA_FETCH_ERROR,
    message: {
      ...context,
      error: errorString.substring(0, 200),
    },
  });
}
