"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeLocalStorageData = exports.getLocalStorageData = exports.setLocalStorageData = exports.supportsLocalStorage = void 0;
/**
 * if current environment supports localstorage
 *
 * @returns {boolean}
 */
var supportsLocalStorage = function (keys) {
    if (keys === void 0) { keys = ['getItem', 'setItem']; }
    try {
        // type guard
        /* istanbul ignore next */
        if (typeof window === 'undefined')
            return false;
        return !!(window.localStorage && keys.every(function (key) { return window.localStorage[key]; }));
    }
    catch (err) {
        /*
        Accessing localStorage on safari mobile sometimes throws a security exception
        when cookies are blocked. Settings > Safari > Block Cookies > Always Blocked.
        This is a blocking exception and does not load the webpage. So we need to catch this
        exception and return false when a SecurityException is thrown.
        https://github.com/angular-translate/angular-translate/issues/629
         */
        /* istanbul ignore next */
        return false;
    }
};
exports.supportsLocalStorage = supportsLocalStorage;
var setLocalStorageData = function (key, value) {
    if ((0, exports.supportsLocalStorage)(['setItem'])) {
        window.localStorage.setItem(key, value);
        return true;
    }
    return false;
};
exports.setLocalStorageData = setLocalStorageData;
var getLocalStorageData = function (key) {
    if ((0, exports.supportsLocalStorage)(['getItem'])) {
        return window.localStorage.getItem(key);
    }
    return null;
};
exports.getLocalStorageData = getLocalStorageData;
var removeLocalStorageData = function (key) {
    if ((0, exports.supportsLocalStorage)(['removeItem'])) {
        window.localStorage.removeItem(key);
        return true;
    }
    return false;
};
exports.removeLocalStorageData = removeLocalStorageData;
//# sourceMappingURL=localStorage.js.map