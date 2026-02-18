import type { LoaderResponse } from '@adrise/hls.js';
import { MEDIA_ERR_DECODE_MESSAGE, PLAYER_ERROR_DETAILS, ErrorType, ERROR_SOURCE, HLSJS_ERROR_DETAILS } from '@adrise/player';
import type { AdError, ErrorEventData } from '@adrise/player';

export function isFatalError(error: ErrorEventData) {
  return !!error.fatal || (typeof MediaError !== 'undefined' && error instanceof MediaError);
}

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
    case 'PS5':
    case 'PS4':
      return error.details === HLSJS_ERROR_DETAILS.KEY_SYSTEM_INCORRECT_DECRYPTION_DATA;
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

export function isDecodeError(error: ErrorEventData | AdError) {
  return [
    MEDIA_ERR_DECODE_MESSAGE.PIPELINE_ERROR_DECODE,
    MEDIA_ERR_DECODE_MESSAGE.VIDEO_DECODER_REINITIALIZATION_FAILED,
    MEDIA_ERR_DECODE_MESSAGE.MEDIA_ELEMENT_ERROR_FORMAT_ERROR,
    MEDIA_ERR_DECODE_MESSAGE.AUDIO_RENDERER_ERROR,
    MEDIA_ERR_DECODE_MESSAGE.PIPELINE_ERROR_READ,
    MEDIA_ERR_DECODE_MESSAGE.DECODER_ERROR_NOT_SUPPORTED,
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

export function isTokenExpiredError(error: ErrorEventData) {
  return (error.details === PLAYER_ERROR_DETAILS.FRAG_LOAD_ERROR && (error.response as LoaderResponse)?.code === 403);
}

export function isHlsJsCodecError(error: ErrorEventData) {
  return error.errorSource === ERROR_SOURCE.HLS_EXTENSION_ERROR && error.details === PLAYER_ERROR_DETAILS.MANIFEST_INCOMPATIBLE_CODECS_ERROR;
}

export function isFragLoadError(error: ErrorEventData) {
  return error.errorSource === ERROR_SOURCE.HLS_EXTENSION_ERROR && error.details === PLAYER_ERROR_DETAILS.FRAG_LOAD_ERROR;
}

export function isManifestLoadError(error: ErrorEventData) {
  return error.errorSource === ERROR_SOURCE.HLS_EXTENSION_ERROR
    && (error.details === PLAYER_ERROR_DETAILS.MANIFEST_LOAD_ERROR
      || error.details === PLAYER_ERROR_DETAILS.MANIFEST_LOAD_TIMEOUT);
}

export function isHlsLoadError(error: ErrorEventData) {
  return isFragLoadError(error) || isManifestLoadError(error);
}

export function isAudioDecoderInitError(error: ErrorEventData) {
  return !!error?.message?.includes(PLAYER_ERROR_DETAILS.AUDIO_DECODER_INIT_FAILED);
}

export function isTizen6UnknownError(error: ErrorEventData): boolean {
  return error?.code === MediaError.MEDIA_ERR_DECODE && navigator.userAgent.includes('Tizen 6.0');
}
