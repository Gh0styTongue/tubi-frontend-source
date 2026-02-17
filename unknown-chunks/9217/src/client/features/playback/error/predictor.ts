import { MEDIA_ERR_DECODE_MESSAGE, PLAYER_ERROR_DETAILS, ErrorType, ERROR_SOURCE } from '@adrise/player';
import type { AdError, ErrorEventData } from '@adrise/player';

import { convertErrorEventDataIntoErrorClientLog } from 'client/features/playback/track/client-log/utils/convertErrorEventDataIntoErrorClientLog';

export function isHDCPIncomplianceError(error: ErrorEventData) {
  return [
    PLAYER_ERROR_DETAILS.KEY_SYSTEM_INVALID_HDCP_VERSION,
    PLAYER_ERROR_DETAILS.KEY_SYSTEM_LICENSE_INVALID_STATUS,
    PLAYER_ERROR_DETAILS.KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED,
  ].includes(error.details ?? '')
  || error.message === PLAYER_ERROR_DETAILS.HDCP_INCOMPLIANCE;
}

export function isDrmError(error: ErrorEventData) {
  if (error.type === ErrorType.KEY_SYSTEM_ERROR || error.type === ErrorType.DRM_ERROR) {
    return true;
  }
  switch (__OTTPLATFORM__) {
    case 'XBOXONE':
      return ((!error.message && !error.code && JSON.stringify(error) === '{}')
        || (!error.message && error.code === 'error'));
    case 'FIRETV_HYB':
      return error.code === MediaError.MEDIA_ERR_DECODE
        && error.message === MEDIA_ERR_DECODE_MESSAGE.VIDEO_DECODER_REINITIALIZATION_FAILED;
    default:
      return false;
  }
}

export function isInvalidCharacterError(error: ErrorEventData) {
  return error.code === DOMException.INVALID_CHARACTER_ERR;
}

export function isContentStartupStallError(error: ErrorEventData) {
  return error.details === PLAYER_ERROR_DETAILS.CONTENT_STARTUP_STALL;
}

export function isDecodeError(error: ErrorEventData) {
  return [
    MEDIA_ERR_DECODE_MESSAGE.PIPELINE_ERROR_DECODE,
    MEDIA_ERR_DECODE_MESSAGE.VIDEO_DECODER_REINITIALIZATION_FAILED,
    PLAYER_ERROR_DETAILS.AUDIO_DECODER_INIT_FAILED,
    PLAYER_ERROR_DETAILS.VIDEO_DECODER_INIT_FAILED,
  ].some(item => !!error.message?.includes(item))
  || error.code === MediaError.MEDIA_ERR_DECODE;
}

export function isSrcNotSupportedError(error: ErrorEventData) {
  return error.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED;
}

export function isAutoStartFailedError(error: ErrorEventData) {
  return (error?.error as Error)?.name === 'NotAllowedError';
}

export function isDomExceptionAbortAdError(error: AdError) {
  return error.name === 'AbortError' && error.code === DOMException.ABORT_ERR;
}

export function isDomExceptionAbortError(error: ErrorEventData) {
  return (error.code === DOMException.ABORT_ERR && (error?.error as Error)?.name === 'AbortError');
}

export function isWebAndroidUnknownNativeError(error: ErrorEventData) {
  const convertedError = convertErrorEventDataIntoErrorClientLog(error);
  return (convertedError.error_code === ErrorType.MEDIA_ERROR
    && convertedError.error_message === MEDIA_ERR_DECODE_MESSAGE.UNKNOWN_ERROR
    && error.errorSource === ERROR_SOURCE.NATIVE_ERROR
    && __WEBPLATFORM__ === 'WEB'
    && ['Android', 'Mobile'].every(item => window.navigator.userAgent.includes(item)));
}

export function isHlsJsCodecError(error: ErrorEventData) {
  return error.errorSource === ERROR_SOURCE.HLS_EXTENSION_ERROR && error.details === PLAYER_ERROR_DETAILS.MANIFEST_INCOMPATIBLE_CODECS_ERROR;
}

export function isLevelTimeoutError(error: ErrorEventData) {
  return error.errorSource === ERROR_SOURCE.HLS_EXTENSION_ERROR && error.details === PLAYER_ERROR_DETAILS.LEVEL_LOAD_TIMEOUT;
}

export function isFragLoadError(error: ErrorEventData) {
  return error.errorSource === ERROR_SOURCE.HLS_EXTENSION_ERROR && error.details === PLAYER_ERROR_DETAILS.FRAG_LOAD_ERROR;
}

export function isAudioDecoderInitError(error: ErrorEventData) {
  return !!error?.message?.includes(PLAYER_ERROR_DETAILS.AUDIO_DECODER_INIT_FAILED);
}

export function isTizen6UnknownError(error: ErrorEventData): boolean {
  return error?.code === MediaError.MEDIA_ERR_DECODE && navigator.userAgent.includes('Tizen 6.0');
}
