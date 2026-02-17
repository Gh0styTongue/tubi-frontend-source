"use strict";
/* istanbul ignore file */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDrmKeySystem = exports.hasDrmSupport = void 0;
var tslib_1 = require("tslib");
var constants_1 = require("../constants");
var hasDrmSupport = function () {
    if (typeof window === 'undefined') {
        return false;
    }
    return typeof window.navigator.requestMediaKeySystemAccess === 'function';
};
exports.hasDrmSupport = hasDrmSupport;
var getDrmKeySystem = function () { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
    var _i, DRM_KEY_SYSTEM_LIST_1, drmKeySystem, mediaKeySystemAccess, err_1;
    return tslib_1.__generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (typeof window === 'undefined') {
                    return [2 /*return*/, null];
                }
                _i = 0, DRM_KEY_SYSTEM_LIST_1 = constants_1.DRM_KEY_SYSTEM_LIST;
                _a.label = 1;
            case 1:
                if (!(_i < DRM_KEY_SYSTEM_LIST_1.length)) return [3 /*break*/, 7];
                drmKeySystem = DRM_KEY_SYSTEM_LIST_1[_i];
                if (!(drmKeySystem.startsWith('com.apple.fps') && window.WebKitMediaKeys)) return [3 /*break*/, 2];
                if (window.WebKitMediaKeys.isTypeSupported(drmKeySystem, 'video/mp4')) {
                    return [2 /*return*/, drmKeySystem];
                }
                return [3 /*break*/, 6];
            case 2:
                if (!(0, exports.hasDrmSupport)()) return [3 /*break*/, 6];
                _a.label = 3;
            case 3:
                _a.trys.push([3, 5, , 6]);
                return [4 /*yield*/, window.navigator.requestMediaKeySystemAccess(drmKeySystem, [
                        {
                            initDataTypes: ['cenc'],
                            audioCapabilities: [
                                {
                                    contentType: 'audio/mp4; codecs="mp4a.40.2"',
                                    robustness: 'SW_SECURE_CRYPTO',
                                },
                            ],
                            videoCapabilities: [
                                {
                                    contentType: 'video/mp4; codecs="avc1.4d401e"',
                                    robustness: 'SW_SECURE_CRYPTO',
                                },
                                {
                                    contentType: 'video/mp4; codecs="avc1.42e01e"',
                                    robustness: 'SW_SECURE_CRYPTO',
                                },
                            ],
                        },
                    ])];
            case 4:
                mediaKeySystemAccess = _a.sent();
                if (mediaKeySystemAccess) {
                    return [2 /*return*/, drmKeySystem];
                }
                return [3 /*break*/, 6];
            case 5:
                err_1 = _a.sent();
                return [3 /*break*/, 6];
            case 6:
                _i++;
                return [3 /*break*/, 1];
            case 7: return [2 /*return*/, constants_1.DrmKeySystem.Invalid];
        }
    });
}); };
exports.getDrmKeySystem = getDrmKeySystem;
//# sourceMappingURL=drm.js.map