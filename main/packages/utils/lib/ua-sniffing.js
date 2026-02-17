"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMobileWebkit = exports.isWebkitIPhone = exports.isWebkitIPad = exports.isChromeOnAndroidMobile = void 0;
/**
 * Are we on a Chrome browser on an Android device, with at least Android 5?
 */
var isChromeOnAndroidMobile = function (userAgent) {
    var _a;
    // currently our whitelist is only allowing Chrome on Android OS >= 5
    // todo - expand whitelist logic
    var browser = userAgent.browser, os = userAgent.os;
    return (browser === null || browser === void 0 ? void 0 : browser.name) === 'Chrome' && (os === null || os === void 0 ? void 0 : os.name) === 'Android' && parseInt((_a = os.version) !== null && _a !== void 0 ? _a : '0', 10) >= 5;
};
exports.isChromeOnAndroidMobile = isChromeOnAndroidMobile;
/**
 * Are we on a webkit browser on an iPad?
 *
 * Note we can assume webkit, because as of 2023 iPhones only support webkit
 * browsers
 *
 * Note that most browsers on iPads have an option called "Request Desktop Site"
 * which when enabled will spoof a Macbook user agent-- a situation which we
 * cannot detect. This function will return false in these case! This setting is
 * set to "true" on many iPad browsers by default
 */
var isWebkitIPad = function (userAgent) {
    var device = userAgent.device, os = userAgent.os;
    return (device === null || device === void 0 ? void 0 : device.model) === 'iPad' && (os === null || os === void 0 ? void 0 : os.name) === 'iOS';
};
exports.isWebkitIPad = isWebkitIPad;
/**
 * Are we on a webkit browser on an iPhone?
 *
 * Note we can assume webkit, because as of 2023 iPhones only support webkit
 * browsers
 *
 * Note that most browsers on iPhones have an option called "Request Desktop Site"
 * which when enabled will spoof a Macbook user agent-- a situation which we
 * cannot detect. This function will return false in these case! However,
 * this option is not set to "true" by default on _any_ iPhone browser,
 * and it is safe to consider this an edge case we do not handle
 */
var isWebkitIPhone = function (userAgent) {
    var device = userAgent.device, os = userAgent.os;
    return (device === null || device === void 0 ? void 0 : device.model) === 'iPhone' && (os === null || os === void 0 ? void 0 : os.name) === 'iOS';
};
exports.isWebkitIPhone = isWebkitIPhone;
/**
 * Are we on a webkit browser on an iPad/iPhone or other iOS device?
 *
 * Note that most browsers on iPads have an option called "Request Desktop Site"
 * which when enabled will spoof a Macbook user agent-- a situation which we
 * cannot detect. This function will return false in these case!
 */
var isMobileWebkit = function (userAgent) {
    return (0, exports.isWebkitIPad)(userAgent) || (0, exports.isWebkitIPhone)(userAgent);
};
exports.isMobileWebkit = isMobileWebkit;
//# sourceMappingURL=ua-sniffing.js.map