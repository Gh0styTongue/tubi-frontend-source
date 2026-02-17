"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeVideoElementPlay = exports.getComputedValue = exports.removeVideoElement = exports.isSamsung2024 = exports.isSamsung2015 = exports.isWebMAF3 = void 0;
function isWebMAF3() {
    return navigator.userAgent.indexOf('WebMAF/v3') !== -1;
}
exports.isWebMAF3 = isWebMAF3;
function isSamsung2015() {
    return navigator.userAgent.indexOf('Tizen 2.3') !== -1;
}
exports.isSamsung2015 = isSamsung2015;
function isSamsung2024() {
    return navigator.userAgent.indexOf('Tizen 8.0') !== -1;
}
exports.isSamsung2024 = isSamsung2024;
var removeVideoElement = function (element) {
    var _a;
    element.pause();
    element.removeAttribute('src'); // empty source
    // on webmaf v3.2.1 we notice that when calling to load
    // and then remove the video element the application can
    // freeze. The app becomes unresponsive but does not crash.
    // We are left seeing frame of video on the screen and user
    // must close the application
    if (!isWebMAF3() && !isSamsung2024()) {
        element.load();
    }
    (_a = element.parentElement) === null || _a === void 0 ? void 0 : _a.removeChild(element);
};
exports.removeVideoElement = removeVideoElement;
/**
 * retrieve some property's computed value of a dom node
 * @param {string|HTMLElement} el
 * @param {property} property
 * @return {string}
 */
function getComputedValue(el, property) {
    var node = typeof el === 'string' ? document.querySelector(el) : el;
    if (!node)
        return '';
    return window.getComputedStyle(node).getPropertyValue("".concat(property));
}
exports.getComputedValue = getComputedValue;
// `play` method may not return a promise in some legacy browsers, so we wrap it here
// @link https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
function safeVideoElementPlay(element, onError) {
    try {
        Promise.resolve(element === null || element === void 0 ? void 0 : element.play())
            .catch(onError);
    }
    catch (e) {
        onError(e);
    }
}
exports.safeVideoElementPlay = safeVideoElementPlay;
//# sourceMappingURL=dom.js.map