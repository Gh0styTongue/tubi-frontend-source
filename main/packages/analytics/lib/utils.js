"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pickKeys = void 0;
var isEmpty_1 = __importDefault(require("lodash/isEmpty"));
var isObject_1 = __importDefault(require("lodash/isObject"));
var pick_1 = __importDefault(require("lodash/pick"));
var pickBy_1 = __importDefault(require("lodash/pickBy"));
/**
 * Useful utility function to pick defined properties from an object.
 * A key is defined if it is non-null or not undefined or not empty object.
 * @param obj
 * @param keys
 */
function pickKeys(obj, keys) {
    var filteredObj = keys ? (0, pick_1.default)(obj, keys) : obj;
    return (0, pickBy_1.default)(filteredObj, function (val) {
        if ((0, isObject_1.default)(val) && (0, isEmpty_1.default)(val))
            return false;
        return val != null;
    });
}
exports.pickKeys = pickKeys;
//# sourceMappingURL=utils.js.map