"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExpectedType = exports.getArrayLastItem = exports.clamp = exports.pick = void 0;
/**
 * creates an object composed of the picked object properties
 * @deprecated please use pick from the lodash package
 */
var pick = function (obj, keys) {
    return keys.reduce(function (acc, key) {
        if (obj.hasOwnProperty(key)) {
            acc[key] = obj[key];
        }
        return acc;
    }, {});
};
exports.pick = pick;
/**
 * make sure the final value is between min and max
 */
var clamp = function (value, min, max) { return Math.min(max, Math.max(min, value)); };
exports.clamp = clamp;
/**
 * get the last item of array
 */
var getArrayLastItem = function (array) {
    return array[array.length - 1];
};
exports.getArrayLastItem = getArrayLastItem;
/**
 * Generic type guard
 * @example
 * isExpectedType<TypeToCheck>(unknownObject, ['props', 'of', 'type'])
*/
var isExpectedType = function (unknownObj, property) {
    if (!unknownObj || typeof unknownObj !== 'object' || Array.isArray(unknownObj)) {
        return false;
    }
    return Array.isArray(property) ? property.every(function (key) { return key in unknownObj; }) : property in unknownObj;
};
exports.isExpectedType = isExpectedType;
//# sourceMappingURL=tools.js.map