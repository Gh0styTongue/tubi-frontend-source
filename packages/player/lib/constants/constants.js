"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTOMATIC_QUALITY_LABEL = exports.HLS_JS_LEVEL = exports.MAX_AD_REQUEST_BLOCKED_CONTINUOUS_COUNT = exports.AD_REQUEST_BLOCKED_ERROR = exports.FROZEN_CAPTIONS_OFF = exports.CURRENT_TIME_PROGRESSED_THRESHOLD = exports.PLAYER_LOG_LEVEL = exports.PLAYER_BUFFER_CHANGE_EMIT_INTERVAL = exports.MIN_LEVEL_DECODED_FRAME = exports.MIN_CHUNK_SIZE = exports.MAX_WAITING_TIME_BEFORE_RETURN_CDN = exports.FULLSCREEN_CHANGE_EVENTS = exports.MANIFEST_CDN_EXPIRED_MAX_RETRY = exports.PLAYER_STORAGE_ADS_REQUEST_BLOCKED = exports.PLAYER_STORAGE_PREVIEW_MUTE = exports.PLAYER_STORAGE_MUTE = exports.PLAYER_STORAGE_VOLUME = exports.PLAYER_STEP_SEEK_INTERVAL = exports.PLAYER_CONTENT_TYPE = exports.PLAYER_CONTAINER_IDS = void 0;
exports.PLAYER_CONTAINER_IDS = {
    jw: 'jw',
    hls: 'hls',
    html5: 'html5',
    samsung: 'avplayerContainer',
};
exports.PLAYER_CONTENT_TYPE = {
    ad: 'content_ad',
    video: 'content_video',
};
exports.PLAYER_STEP_SEEK_INTERVAL = 30;
exports.PLAYER_STORAGE_VOLUME = 'tubiplayer.storage.volume';
exports.PLAYER_STORAGE_MUTE = 'tubiplayer.storage.mute';
exports.PLAYER_STORAGE_PREVIEW_MUTE = 'tubiplayer.storage.preview_mute';
exports.PLAYER_STORAGE_ADS_REQUEST_BLOCKED = 'tubiplayer.storage.arb';
exports.MANIFEST_CDN_EXPIRED_MAX_RETRY = 3;
exports.FULLSCREEN_CHANGE_EVENTS = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'mozfullscreenchange',
    'MSFullscreenChange',
];
exports.MAX_WAITING_TIME_BEFORE_RETURN_CDN = 3000;
// The minimum chunk size required to emit a progress event is 128kb
exports.MIN_CHUNK_SIZE = Math.pow(2, 17);
exports.MIN_LEVEL_DECODED_FRAME = 600;
exports.PLAYER_BUFFER_CHANGE_EMIT_INTERVAL = 1000;
var PLAYER_LOG_LEVEL;
(function (PLAYER_LOG_LEVEL) {
    PLAYER_LOG_LEVEL["DISABLE"] = "DISABLE";
    PLAYER_LOG_LEVEL["ADAPTER_LEVEL"] = "ADAPTER_LEVEL";
    PLAYER_LOG_LEVEL["SDK_LEVEL"] = "SDK_LEVEL";
})(PLAYER_LOG_LEVEL = exports.PLAYER_LOG_LEVEL || (exports.PLAYER_LOG_LEVEL = {}));
exports.CURRENT_TIME_PROGRESSED_THRESHOLD = 0.5;
exports.FROZEN_CAPTIONS_OFF = {
    id: 'Off',
    label: 'Off',
    lang: 'Off',
};
exports.AD_REQUEST_BLOCKED_ERROR = {
    message: 'MEDIA_ELEMENT_ERROR: Format error',
};
exports.MAX_AD_REQUEST_BLOCKED_CONTINUOUS_COUNT = 5;
exports.HLS_JS_LEVEL = {
    // use 99 instead of Infinity to avoid JSON.stringify issue
    // 99 is assumed to be larger than any number of levels we would see in a manifest.
    MAX: 99,
    HIGH: 3,
    LOWEST: 0,
    AUTO: -1,
    NONE: undefined,
};
exports.AUTOMATIC_QUALITY_LABEL = 'Auto';
//# sourceMappingURL=constants.js.map