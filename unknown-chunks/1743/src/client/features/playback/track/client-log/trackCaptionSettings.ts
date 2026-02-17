import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

export function trackCaptionSettings({
  errorMessage,
  changedOptions,
}: {
  errorMessage?: string,
  changedOptions: string[]
}) {
  trackLogging({
    type: TRACK_LOGGING.clientInfo,
    subtype: LOG_SUB_TYPE.CAPTIONS_SETTINGS,
    message: {
      errorMessage,
      changedOptions,
    },
  });
}
