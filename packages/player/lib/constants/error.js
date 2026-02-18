"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_HLS_ERROR_RELOAD_MEDIA_URL_COUNT = exports.MAX_HLS_MANIFEST_LOAD_TIMEOUT_RETRY_COUNT = exports.MAX_RECOVER_HLS_NETWORK_ERROR_COUNT = exports.MAX_RECOVER_HLS_MEDIA_ERROR_COUNT = exports.ERROR_SOURCE = exports.MEDIA_ERROR_CODES = exports.GET_NONCE_ERROR = exports.PLAYER_ERROR_DETAILS = exports.HLSJS_ERROR_DETAILS = exports.VAST_AD_NOT_USED = exports.VAST_ERROR_CODE = exports.TIZEN_PARSE_AUDIO_TRACKS_DETAIL = exports.TIZEN_UNSUPPORTED_FILE = exports.TIZEN_PLAYER_ERROR_INVALID_STATE = exports.TIZEN_CONNECTION_FAILED_ERROR = exports.TIZEN_PARSE_AUDIO_TRACKS_ERROR = exports.TIZEN_DRM_REQUEST = exports.TIZEN_SET_DRM_ERROR = exports.TIZEN_DRM_ERROR = exports.MEDIA_ERR_DECODE_MESSAGE = void 0;
var tslib_1 = require("tslib");
exports.MEDIA_ERR_DECODE_MESSAGE = {
    UNKNOWN_ERROR: 'unknown error',
    PIPELINE_ERROR_DECODE: 'PIPELINE_ERROR_DECODE',
    VIDEO_DECODER_REINITIALIZATION_FAILED: 'PIPELINE_ERROR_DECODE: video decoder reinitialization failed',
};
exports.TIZEN_DRM_ERROR = 'DrmError';
exports.TIZEN_SET_DRM_ERROR = 'setDrmError';
exports.TIZEN_DRM_REQUEST = 'Challenge';
exports.TIZEN_PARSE_AUDIO_TRACKS_ERROR = 'ParseAudioTracksError';
exports.TIZEN_CONNECTION_FAILED_ERROR = 'PLAYER_ERROR_CONNECTION_FAILED';
exports.TIZEN_PLAYER_ERROR_INVALID_STATE = 'PLAYER_ERROR_INVALID_STATE';
exports.TIZEN_UNSUPPORTED_FILE = 'PLAYER_ERROR_NOT_SUPPORTED_FILE';
exports.TIZEN_PARSE_AUDIO_TRACKS_DETAIL = 'PLAYER_ERROR_PARSE_AUDIO_TRACKS';
// https://iabtechlab.com/wp-content/uploads/2019/06/VAST_4.2_final_june26.pdf
exports.VAST_ERROR_CODE = {
    MEDIA_PLAYER_ERROR: '400',
    MEDIA_FILE_TIMEOUT: '402',
    MEDIA_FORMAT_NOT_SUPPORT: '403',
    MEDIA_DECODE_ERROR: '405',
    UNDEFINED_ERROR: '900',
};
var VAST_AD_NOT_USED;
(function (VAST_AD_NOT_USED) {
    VAST_AD_NOT_USED["EXIT_PRE_POD"] = "exit_pre_pod";
    VAST_AD_NOT_USED["EXIT_MID_POD"] = "exit_mid_pod";
    VAST_AD_NOT_USED["FFWD"] = "ffwd";
})(VAST_AD_NOT_USED = exports.VAST_AD_NOT_USED || (exports.VAST_AD_NOT_USED = {}));
exports.HLSJS_ERROR_DETAILS = {
    KEY_SYSTEM_INVALID_HDCP_VERSION: 'keySystemInvalidHdcpVersion',
    KEY_SYSTEM_LICENSE_INVALID_STATUS: 'keySystemLicenseInvalidStatus',
    KEY_SYSTEM_LICENSE_INTERNAL_ERROR: 'keySystemLicenseInternalError',
    KEY_SYSTEM_LICENSE_EXPIRED: 'keySystemLicenseExpired',
    KEY_SYSTEM_NO_KEYS: 'keySystemNoKeys',
    KEY_SYSTEM_NO_ACCESS: 'keySystemNoAccess',
    KEY_SYSTEM_NO_SESSION: 'keySystemNoSession',
    KEY_SYSTEM_LICENSE_REQUEST_FAILED: 'keySystemLicenseRequestFailed',
    KEY_SYSTEM_NO_INIT_DATA: 'keySystemNoInitData',
    KEY_SYSTEM_STATUS_OUTPUT_RESTRICTED: 'keySystemStatusOutputRestricted',
    KEY_SYSTEM_SESSION_UPDATE_FAILED: 'keySystemSessionUpdateFailed',
    MANIFEST_LOAD_ERROR: 'manifestLoadError',
    MANIFEST_LOAD_TIMEOUT: 'manifestLoadTimeOut',
    MANIFEST_PARSING_ERROR: 'manifestParsingError',
    MANIFEST_INCOMPATIBLE_CODECS_ERROR: 'manifestIncompatibleCodecsError',
    LEVEL_EMPTY_ERROR: 'levelEmptyError',
    LEVEL_LOAD_ERROR: 'levelLoadError',
    LEVEL_LOAD_TIMEOUT: 'levelLoadTimeOut',
    LEVEL_SWITCH_ERROR: 'levelSwitchError',
    AUDIO_TRACK_LOAD_ERROR: 'audioTrackLoadError',
    AUDIO_TRACK_LOAD_TIMEOUT: 'audioTrackLoadTimeOut',
    SUBTITLE_LOAD_ERROR: 'subtitleTrackLoadError',
    SUBTITLE_TRACK_LOAD_TIMEOUT: 'subtitleTrackLoadTimeOut',
    FRAG_LOAD_ERROR: 'fragLoadError',
    FRAG_LOAD_TIMEOUT: 'fragLoadTimeOut',
    FRAG_DECRYPT_ERROR: 'fragDecryptError',
    FRAG_PARSING_ERROR: 'fragParsingError',
    FRAG_REVERT_ERROR: 'fragRevetError',
    REMUX_ALLOC_ERROR: 'remuxAllocError',
    KEY_LOAD_ERROR: 'keyLoadError',
    KEY_LOAD_TIMEOUT: 'keyLoadTimeOut',
    BUFFER_ADD_CODEC_ERROR: 'bufferAddCodecError',
    BUFFER_INCOMPATIBLE_CODECS_ERROR: 'bufferIncompatibleCodecsError',
    BUFFER_APPEND_ERROR: 'bufferAppendError',
    BUFFER_REVERT_APPEND_ERROR: 'bufferRevertAppendError',
    BUFFER_APPENDING_ERROR: 'bufferAppendingError',
    BUFFER_STALLED_ERROR: 'bufferStalledError',
    BUFFER_FULL_ERROR: 'bufferFullError',
    BUFFER_SEEK_OVER_HOLE: 'bufferSeekOverHole',
    BUFFER_NUDGE_ON_STALL: 'bufferNudgeOnStall',
    BUFFER_CUE_EMPTY_ON_SB_UPDATE_START: 'bufferCueEmptyOnSBUpdateStart',
    BUFFER_CUE_EMPTY_ON_SB_UPDATE_END: 'bufferCueEmptyOnSBUpdateEnd',
    INTERNAL_EXCEPTION: 'internalException',
    INTERNAL_ABORTED: 'aborted',
};
exports.PLAYER_ERROR_DETAILS = tslib_1.__assign(tslib_1.__assign({}, exports.HLSJS_ERROR_DETAILS), { HDCP_INCOMPLIANCE: 'HDCP_INCOMPLIANCE', UNKNOWN_DRM_ERROR: 'unknownDrmError', LIVE_PLAYBACK_ERROR: 'livePlaybackError', PURPLE_CARPET_LIVE_PLAYBACK_ERROR: 'purpleCarpetLivePlaybackError', CODEC_ERROR: 'codecError', MANIFEST_CDN_EXPIRED: 'manifestExpired', DEVIATED_BUFFER_FLUSHING: 'hlsDeviatedBufferFlushing', LINEAR_SESSION_EXPIRED: 'linearSessionExpired', UNKNOWN_HEVC_ERROR: 'unknownHevcError', AUDIO_DECODER_INIT_FAILED: 'audio decoder initialization failed', VIDEO_DECODER_INIT_FAILED: 'video decoder initialization failed', AD_REQUEST_BLOCKED_ERROR: 'adRequestBlockedError', CONTENT_STARTUP_STALL: 'contentStartupStall' });
var GET_NONCE_ERROR;
(function (GET_NONCE_ERROR) {
    GET_NONCE_ERROR["UNABLE_TO_FETCH_SDK"] = "UNABLE_TO_FETCH_SDK";
    GET_NONCE_ERROR["NONCE_LOADER_FAILED"] = "NONCE_LOADER_FAILED";
    GET_NONCE_ERROR["CRYPTO_NOT_SUPPORTED"] = "CRYPTO_NOT_SUPPORTED";
})(GET_NONCE_ERROR = exports.GET_NONCE_ERROR || (exports.GET_NONCE_ERROR = {}));
// check detail at https://developer.mozilla.org/en-US/docs/Web/API/MediaError
exports.MEDIA_ERROR_CODES = {
    1: 'MEDIA_ERR_ABORTED',
    2: 'MEDIA_ERR_NETWORK',
    3: 'MEDIA_ERR_DECODE',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED',
};
var ERROR_SOURCE;
(function (ERROR_SOURCE) {
    ERROR_SOURCE["AVPLAY_ERROR"] = "avplay";
    ERROR_SOURCE["NATIVE_ERROR"] = "native";
    ERROR_SOURCE["HLS_EXTENSION_ERROR"] = "hls.js";
    ERROR_SOURCE["OTHER"] = "other";
})(ERROR_SOURCE = exports.ERROR_SOURCE || (exports.ERROR_SOURCE = {}));
exports.MAX_RECOVER_HLS_MEDIA_ERROR_COUNT = 3;
exports.MAX_RECOVER_HLS_NETWORK_ERROR_COUNT = 3;
exports.MAX_HLS_MANIFEST_LOAD_TIMEOUT_RETRY_COUNT = 1;
exports.MAX_HLS_ERROR_RELOAD_MEDIA_URL_COUNT = 3;
//# sourceMappingURL=error.js.map