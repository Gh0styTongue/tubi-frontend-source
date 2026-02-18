"use strict";
/**
 * NB: It is important that this file does not import code from other files.
 * This is because it is used in the intro animation code and thus needs to be
 * as small as possible to keep the size of the initial HTML down.
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildQueryString = exports.parseQueryBoolean = exports.queryStringify = exports.addQueryStringToUrl = exports.parseQueryString = exports.getQueryStringFromUrl = void 0;
var getQueryStringFromUrl = function (url) {
    var index = url.indexOf('?');
    if (index === -1)
        return '';
    return url.slice(index + 1);
};
exports.getQueryStringFromUrl = getQueryStringFromUrl;
/**
 * accept query string and return object with key value pairs
 * @param str
 * @returns {{}}
 */
var parseQueryString = function (str) {
    if (str === void 0) { str = ''; }
    if (str.length === 0)
        return {};
    var copied = str;
    if (str[0] === '?')
        copied = copied.slice(1);
    return copied.split('&')
        .reduce(function (queryParams, kv) {
        if (kv.indexOf('=') < 0)
            return queryParams;
        var _a = kv.split('='), key = _a[0], rawValue = _a[1];
        if (!key)
            return queryParams;
        var value;
        try {
            value = JSON.parse(decodeURIComponent(rawValue));
        }
        catch (e) {
            if (e instanceof Error && e.name === 'URIError' && e.message === 'URI malformed') {
                value = rawValue;
            }
            else {
                value = decodeURIComponent(rawValue);
            }
        }
        queryParams[key] = value;
        return queryParams;
    }, {});
};
exports.parseQueryString = parseQueryString;
var addQueryStringToUrl = function (url, queryStringObj) {
    var newUrl = url;
    var qs = (0, exports.getQueryStringFromUrl)(url);
    var newQueryStringObj = queryStringObj;
    if (qs) {
        newUrl = url.split('?')[0];
        newQueryStringObj = __assign(__assign({}, (0, exports.parseQueryString)(qs)), newQueryStringObj);
    }
    var stringifiedQuery = queryStringify(newQueryStringObj);
    var isEmptyString = stringifiedQuery.trim() === '';
    return "".concat(newUrl).concat(!isEmptyString ? "?".concat(stringifiedQuery) : '');
};
exports.addQueryStringToUrl = addQueryStringToUrl;
/**
 * Our own simple version of query-string.stringify
 * @param {Object} queryParams
 * @example {title: 'igor', view: 123} ~> 'title=igor&view=123'
 */
function queryStringify(queryParams) {
    if (queryParams === void 0) { queryParams = {}; }
    return Object.keys(queryParams)
        .filter(Boolean)
        .map(function (key) {
        var value = queryParams[key];
        var valueStr = typeof value === 'object' ? JSON.stringify(value) : value;
        return "".concat(encodeURIComponent(key), "=").concat(encodeURIComponent("".concat(valueStr)));
    })
        .join('&');
}
exports.queryStringify = queryStringify;
/**
 * parse query string into Boolean values
 */
var parseQueryBoolean = function (query) {
    if (query === 'true')
        return true;
    if (query === 'false')
        return false;
    return query;
};
exports.parseQueryBoolean = parseQueryBoolean;
/**
 * join keys and values into query string, including "?" at head
 * @param {Object} [obj={}]
 * @returns {string}
 */
var buildQueryString = function (obj) {
    if (obj === void 0) { obj = {}; }
    if (!Object.keys(obj).length)
        return '';
    return "?".concat(queryStringify(obj));
};
exports.buildQueryString = buildQueryString;
//# sourceMappingURL=queryString.js.map