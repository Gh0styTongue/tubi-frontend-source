"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRM_KEY_SYSTEM_LIST = exports.DrmKeySystem = void 0;
var DrmKeySystem;
(function (DrmKeySystem) {
    DrmKeySystem["Invalid"] = "invalid";
    DrmKeySystem["PlayReady"] = "com.microsoft.playready";
    DrmKeySystem["Widevine"] = "com.widevine.alpha";
    DrmKeySystem["FairPlay"] = "com.apple.fps.1_0";
})(DrmKeySystem = exports.DrmKeySystem || (exports.DrmKeySystem = {}));
exports.DRM_KEY_SYSTEM_LIST = [
    DrmKeySystem.Widevine,
    DrmKeySystem.PlayReady,
    DrmKeySystem.FairPlay,
];
//# sourceMappingURL=drm.js.map