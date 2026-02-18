"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmptyObject = exports.size = void 0;
/**
 * This is intended as a smaller and less complete version of Lodash's size() method.
 * See https://github.com/lodash/lodash/blob/4.17.10/lodash.js#L9842-L9854
 * @param {unknown} obj An object or array (poss undefined) to get the number of keys or length of.
 */
var size = function (obj) {
    if (!obj)
        return 0;
    if (Array.isArray(obj))
        return obj.length;
    return Object.keys(obj).length;
};
exports.size = size;
/**
 * checks if value is an empty object
 * @param {*} value
 * @returns {boolean}
 */
var isEmptyObject = function (value) { return (0, exports.size)(value || {}) === 0; };
exports.isEmptyObject = isEmptyObject;
//# sourceMappingURL=size.js.map