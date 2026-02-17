"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptionsErrorType = exports.AdapterTypes = exports.ActionTypes = exports.ActionTypeInTimeoutPromise = exports.CustomPlaybackHandler = exports.isHlsExtensionConfig = exports.RESUME_MODE = exports.PlayerName = void 0;
var PlayerName;
(function (PlayerName) {
    PlayerName["Preview"] = "tubi-web-preview";
    PlayerName["Linear"] = "tubi-web-live";
    PlayerName["Trailer"] = "tubi-web-trailer";
    PlayerName["VOD"] = "tubi-web";
    PlayerName["AD"] = "tubi-web-ad";
})(PlayerName = exports.PlayerName || (exports.PlayerName = {}));
var RESUME_MODE;
(function (RESUME_MODE) {
    RESUME_MODE[RESUME_MODE["CONTROL"] = 0] = "CONTROL";
    RESUME_MODE[RESUME_MODE["AUTOPLAY_VIA_VIDEOSELF"] = 1] = "AUTOPLAY_VIA_VIDEOSELF";
    RESUME_MODE[RESUME_MODE["AUTOPLAY_VIA_CANPLAY"] = 2] = "AUTOPLAY_VIA_CANPLAY";
    RESUME_MODE[RESUME_MODE["AUTOPLAY_VIA_LOADEDDATA"] = 3] = "AUTOPLAY_VIA_LOADEDDATA";
})(RESUME_MODE = exports.RESUME_MODE || (exports.RESUME_MODE = {}));
function isHlsExtensionConfig(config) {
    if (config === void 0) { config = {}; }
    return config.hls !== undefined;
}
exports.isHlsExtensionConfig = isHlsExtensionConfig;
var CustomPlaybackHandler = /** @class */ (function () {
    function CustomPlaybackHandler(config, adapter, coreInstance) {
        this.config = config;
        this.adapter = adapter;
        this.coreInstance = coreInstance;
        this.setup();
    }
    return CustomPlaybackHandler;
}());
exports.CustomPlaybackHandler = CustomPlaybackHandler;
var ActionTypeInTimeoutPromise;
(function (ActionTypeInTimeoutPromise) {
    ActionTypeInTimeoutPromise["PLAY"] = "play";
    ActionTypeInTimeoutPromise["PAUSE"] = "pause";
    ActionTypeInTimeoutPromise["SEEK"] = "seek";
    ActionTypeInTimeoutPromise["UPDATE_DRM_KEY"] = "updateDrmKeySystem";
})(ActionTypeInTimeoutPromise = exports.ActionTypeInTimeoutPromise || (exports.ActionTypeInTimeoutPromise = {}));
var ActionTypes;
(function (ActionTypes) {
    ActionTypes["OTHER"] = "OTHER";
    ActionTypes["RESET_PLAYER"] = "RESET_PLAYER";
    ActionTypes["TRANSIT_PLAYER_STATE"] = "TRANSIT_PLAYER_STATE";
    ActionTypes["UPDATE_AD_PROGRESS"] = "UPDATE_AD_PROGRESS";
    ActionTypes["UPDATE_DRM_KEY_SYSTEM"] = "UPDATE_DRM_KEY_SYSTEM";
    ActionTypes["UPDATE_PLAYER_AD_INFO"] = "UPDATE_PLAYER_AD_INFO";
    ActionTypes["UPDATE_PLAYER_CAPTIONS"] = "UPDATE_PLAYER_CAPTIONS";
    ActionTypes["UPDATE_PLAYER_PROGRESS"] = "UPDATE_PLAYER_PROGRESS";
    ActionTypes["UPDATE_PLAYER_QUALITY"] = "UPDATE_PLAYER_QUALITY";
    ActionTypes["UPDATE_PLAYER_VOLUME"] = "UPDATE_PLAYER_VOLUME";
    ActionTypes["UPDATE_PLAYER_BITRATE"] = "UPDATE_PLAYER_BITRATE";
    ActionTypes["UPDATE_TIME_GAP_TO_LAST_BUFFER"] = "UPDATE_TIME_GAP_TO_LAST_BUFFER";
    ActionTypes["SET_AUTOPLAY_CAPABILITY"] = "SET_AUTOPLAY_CAPABILITY";
    ActionTypes["UPDATE_VIDEO_PREVIEW_MUTED"] = "UPDATE_VIDEO_PREVIEW_MUTED";
})(ActionTypes = exports.ActionTypes || (exports.ActionTypes = {}));
var AdapterTypes;
(function (AdapterTypes) {
    AdapterTypes["HTML5"] = "html5";
    AdapterTypes["WEB"] = "web";
    AdapterTypes["SAMSUNG"] = "samsung";
})(AdapterTypes = exports.AdapterTypes || (exports.AdapterTypes = {}));
// we may add more subtypes here in the future
var CaptionsErrorType;
(function (CaptionsErrorType) {
    // identifier for a captions-related error
    CaptionsErrorType["CAPTIONS_ERROR"] = "captionsError";
})(CaptionsErrorType = exports.CaptionsErrorType || (exports.CaptionsErrorType = {}));
//# sourceMappingURL=types.js.map