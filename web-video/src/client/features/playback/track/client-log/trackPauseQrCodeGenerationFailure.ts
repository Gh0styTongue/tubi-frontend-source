import { LOG_SUB_TYPE, TRACK_LOGGING } from 'common/constants/error-types';
import { trackLogging } from 'common/utils/track';

interface TrackPauseQrCodeGenerationFailureParams {
  error: unknown
}

export function trackPauseQrCodeGenerationFailure(context: TrackPauseQrCodeGenerationFailureParams): void {
  let errorString: string;
  if (context.error instanceof Error) {
    errorString = context.error.toString();
  } else {
    errorString = String(context.error);
  }

  trackLogging({
    type: TRACK_LOGGING.clientInfo,
    subtype: LOG_SUB_TYPE.PAUSE_QR_CODE.QR_CODE_GENERATION_FAILURE,
    message: {
      error: errorString.substring(0, 200),
    },
  });
}
