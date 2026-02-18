"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedEventEmitter = void 0;
var events_1 = require("events");
var TypedEventEmitter = /** @class */ (function (_super) {
    __extends(TypedEventEmitter, _super);
    function TypedEventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TypedEventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return _super.prototype.emit.apply(this, __spreadArray([event], args, false));
    };
    TypedEventEmitter.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    TypedEventEmitter.prototype.off = function (event, listener) {
        return _super.prototype.off.call(this, event, listener);
    };
    TypedEventEmitter.prototype.once = function (event, listener) {
        return _super.prototype.once.call(this, event, listener);
    };
    TypedEventEmitter.prototype.removeListener = function (event, listener) {
        return _super.prototype.removeListener.call(this, event, listener);
    };
    TypedEventEmitter.prototype.addListener = function (event, listener) {
        return _super.prototype.addListener.call(this, event, listener);
    };
    return TypedEventEmitter;
}(events_1.EventEmitter));
exports.TypedEventEmitter = TypedEventEmitter;
//# sourceMappingURL=TypedEventEmitter.js.map