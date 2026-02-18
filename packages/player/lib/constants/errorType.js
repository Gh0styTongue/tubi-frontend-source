"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorType = void 0;
var ErrorType;
(function (ErrorType) {
    // identifier for adErrors
    ErrorType["AD_ERROR"] = "adError";
    // emitted if there is a blocking error before 'ready' event, during setup()
    ErrorType["SETUP_ERROR"] = "setupError";
    // identifier for a network error (loading error / timeout ...)
    ErrorType["NETWORK_ERROR"] = "networkError";
    // identifier for a media Error (video/parsing/mediasource error)
    ErrorType["MEDIA_ERROR"] = "mediaError";
    // identifier for a captions-related error
    // identifier for all other errors
    ErrorType["OTHER_ERROR"] = "otherError";
    // EME (encrypted media extensions) errors
    ErrorType["DRM_ERROR"] = "DRM";
    // extend error type from hls.js
    ErrorType["KEY_SYSTEM_ERROR"] = "keySystemError";
    ErrorType["MUX_ERROR"] = "muxError";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
//# sourceMappingURL=errorType.js.map