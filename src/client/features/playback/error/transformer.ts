import { ERROR_SOURCE, ErrorType, PLAYER_ERROR_DETAILS } from '@adrise/player';
import type { ErrorEventData } from '@adrise/player';

export function nativeErrorTransformer(
  error: MediaError | null | Error & { code?: number },
  videoElement: HTMLVideoElement,
  isDrmHdcp: boolean): undefined | ErrorEventData {
  if (!error) return;
  switch (__OTTPLATFORM__) {
    case 'FIRETV_HYB':
      // There is no direct approach to know the HDCP issue, so we infer it by another error caused by it
      // `readyState` is 1 when resuming, 2 on FireTV Stick Gen 1, and 4 on 4K
      // @link https://docs.google.com/document/d/1htUN6T7DvbLLTKA0g-1QhNR66KA6FPJkCi7VHLZpuN4/edit#heading=h.oa2ltsybcl20
      if (
        isDrmHdcp
        && error.code === 3
        && error.message.startsWith('PIPELINE_ERROR_DECODE')
        && videoElement.paused
        && videoElement.currentTime > 0
      ) {
        const errorData = {
          type: ErrorType.DRM_ERROR,
          message: PLAYER_ERROR_DETAILS.HDCP_INCOMPLIANCE,
          details: PLAYER_ERROR_DETAILS.HDCP_INCOMPLIANCE,
          originalMessage: error.message,
          fatal: true,
          errorSource: ERROR_SOURCE.NATIVE_ERROR,
          hasMediaKeys: !!videoElement.mediaKeys,
        };
        return errorData;
      }
      break;
    default:
      break;
  }
}
