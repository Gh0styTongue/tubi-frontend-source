"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerEventEmitter = void 0;
var tslib_1 = require("tslib");
var events_1 = require("events");
var PlayerEventEmitter = /** @class */ (function (_super) {
    tslib_1.__extends(PlayerEventEmitter, _super);
    function PlayerEventEmitter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PlayerEventEmitter.prototype.emit = function (event) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return _super.prototype.emit.apply(this, tslib_1.__spreadArray([event], args, false));
    };
    PlayerEventEmitter.prototype.on = function (event, listener) {
        return _super.prototype.on.call(this, event, listener);
    };
    PlayerEventEmitter.prototype.off = function (event, listener) {
        return _super.prototype.off.call(this, event, listener);
    };
    PlayerEventEmitter.prototype.once = function (event, listener) {
        return _super.prototype.once.call(this, event, listener);
    };
    PlayerEventEmitter.prototype.removeListener = function (event, listener) {
        return _super.prototype.removeListener.call(this, event, listener);
    };
    PlayerEventEmitter.prototype.addListener = function (event, listener) {
        return _super.prototype.addListener.call(this, event, listener);
    };
    return PlayerEventEmitter;
}(events_1.EventEmitter));
exports.PlayerEventEmitter = PlayerEventEmitter;
//# sourceMappingURL=PlayerEventEmitter.js.map