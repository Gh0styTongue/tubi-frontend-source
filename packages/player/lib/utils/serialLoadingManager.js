"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var time_1 = require("@adrise/utils/lib/time");
var constants_1 = require("../constants");
var SerialLoadingMode = {
    NO_SERIAL_LOADING: 0,
    ENABLE_SERIAL_LOADING_FOR_SLOW_NETWORK: 1,
    ENABLE_SERIAL_LOADING_FOR_SEEK: 2,
    ENABLE_SERIAL_LOADING_FOR_SLOW_NETWORK_AND_SEEK: 3,
};
var SLOW_DOWNLOAD_SPEED_THRESHOLD = 3000000; // 3Mbits/s
var SEEKED_DISABLE_SERIAL_LOADING_TIME = 5000; // 5000 milliseconds
var ENABLE_SERIAL_LOADING_SLOW_REQUEST_RATE_THRESHOLD = 0.8;
var DISABLE_SERIAL_LOADING_SLOW_REQUEST_RATE_THRESHOLD = 0.5;
var MAX_REQUEST_STATS_LENGTH = 10;
var SerialLoadingManager = /** @class */ (function () {
    function SerialLoadingManager(options) {
        var _this = this;
        var _a;
        this.serialLoadingMode = SerialLoadingMode.NO_SERIAL_LOADING;
        this.isLastSlowNetwork = false;
        this.requestStats = [];
        this.lastSeekedTime = -1;
        this.onMediaAttached = function (event, data) {
            var media = data.media;
            /* istanbul ignore if: safety check only */
            if (!media) {
                return;
            }
            media.addEventListener('seeking', _this.onSeeking);
            media.addEventListener('seeked', _this.onSeeked);
        };
        this.onMediaDetached = function () {
            var hls = _this.hls;
            var media = hls.media;
            /* istanbul ignore if: safety check only */
            if (!media) {
                return;
            }
            media.removeEventListener('seeking', _this.onSeeking);
            media.removeEventListener('seeked', _this.onSeeked);
        };
        this.onSeeking = function () {
            _this.playerEventEmitter.emit(constants_1.PLAYER_EVENTS.canEnableSerialLoading);
            if (_this.serialLoadingMode === SerialLoadingMode.ENABLE_SERIAL_LOADING_FOR_SEEK
                || _this.serialLoadingMode === SerialLoadingMode.ENABLE_SERIAL_LOADING_FOR_SLOW_NETWORK_AND_SEEK) {
                _this.hls.setSerialLoading(true);
            }
        };
        this.onSeeked = function () {
            _this.lastSeekedTime = (0, time_1.now)();
        };
        this.onFragLoaded = function (event, data) {
            if (data.frag.type !== 'main')
                return;
            var downloadSpeed = data.frag.stats.total * 8 * 1000 / (data.frag.stats.loading.end - data.frag.stats.loading.start); // bits/s
            _this.requestStats.push(downloadSpeed);
            if (_this.requestStats.length > MAX_REQUEST_STATS_LENGTH) { // only keep the last 10 requests
                _this.requestStats.shift();
            }
            var isSlowNetwork = _this.isSlowNetwork();
            if (isSlowNetwork !== undefined && isSlowNetwork !== _this.isLastSlowNetwork) {
                _this.isLastSlowNetwork = isSlowNetwork;
                if (isSlowNetwork) {
                    _this.playerEventEmitter.emit(constants_1.PLAYER_EVENTS.canEnableSerialLoading);
                }
                if (_this.serialLoadingMode === SerialLoadingMode.ENABLE_SERIAL_LOADING_FOR_SLOW_NETWORK
                    || _this.serialLoadingMode === SerialLoadingMode.ENABLE_SERIAL_LOADING_FOR_SLOW_NETWORK_AND_SEEK) {
                    _this.hls.setSerialLoading(isSlowNetwork);
                }
            }
            if (_this.serialLoadingMode === SerialLoadingMode.ENABLE_SERIAL_LOADING_FOR_SEEK
                || _this.serialLoadingMode === SerialLoadingMode.ENABLE_SERIAL_LOADING_FOR_SLOW_NETWORK_AND_SEEK) {
                if (_this.lastSeekedTime > -1
                    && (0, time_1.now)() - _this.lastSeekedTime > SEEKED_DISABLE_SERIAL_LOADING_TIME) {
                    _this.lastSeekedTime = -1;
                    if (!_this.isLastSlowNetwork || _this.serialLoadingMode === SerialLoadingMode.ENABLE_SERIAL_LOADING_FOR_SEEK) {
                        _this.hls.setSerialLoading(false);
                    }
                }
            }
        };
        this.hls = options.hls;
        this.Hls = options.Hls;
        this.serialLoadingMode = (_a = options.serialLoadingMode) !== null && _a !== void 0 ? _a : SerialLoadingMode.NO_SERIAL_LOADING;
        this.playerEventEmitter = options.playerEventEmitter;
        this.detachHlsEvents = this.attachHlsEvents();
    }
    SerialLoadingManager.prototype.attachHlsEvents = function () {
        var _this = this;
        var Hls = this.Hls;
        this.hls.on(Hls.Events.MEDIA_ATTACHED, this.onMediaAttached, this);
        this.hls.on(Hls.Events.MEDIA_DETACHED, this.onMediaDetached, this);
        this.hls.on(Hls.Events.FRAG_LOADED, this.onFragLoaded);
        return function () {
            /* istanbul ignore if: safety check only */
            if (!_this.hls)
                return;
            _this.hls.off(Hls.Events.MEDIA_ATTACHED, _this.onMediaAttached, _this);
            _this.hls.off(Hls.Events.MEDIA_DETACHED, _this.onMediaDetached, _this);
            _this.hls.off(Hls.Events.FRAG_LOADED, _this.onFragLoaded);
        };
    };
    SerialLoadingManager.prototype.isSlowNetwork = function () {
        if (this.requestStats.length >= MAX_REQUEST_STATS_LENGTH) {
            var slowRequestCount = this.requestStats.filter(function (speed) { return speed < SLOW_DOWNLOAD_SPEED_THRESHOLD; }).length;
            var slowRequestRate = slowRequestCount / this.requestStats.length;
            if (slowRequestRate >= ENABLE_SERIAL_LOADING_SLOW_REQUEST_RATE_THRESHOLD) {
                return true;
            }
            if (slowRequestRate < DISABLE_SERIAL_LOADING_SLOW_REQUEST_RATE_THRESHOLD) {
                return false;
            }
        }
        return undefined; // It's a hysteresis logic here, we return undefined and don't call `setSerialLoading` for request rate between 0.5 and 0.8
    };
    SerialLoadingManager.prototype.destroy = function () {
        this.detachHlsEvents();
    };
    return SerialLoadingManager;
}());
exports.default = SerialLoadingManager;
//# sourceMappingURL=serialLoadingManager.js.map