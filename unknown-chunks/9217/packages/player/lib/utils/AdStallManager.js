"use strict";
/**
 * AdStallManager is designed to track a specific stalling issue reported on FireTV
 * where only a few `timeupdate` events will follow a `waiting` within the first 3-5 seconds
 * of playback. Users have reported seeing only a black screen appear with audible audio playback
 * for a few seconds before playback stalls
 *
 * More info: https://www.notion.so/tubi/FireTV-Ad-Stall-9fe1775346d74578baf7d66601c71a2a
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdStallManager = exports.AD_WAITING_TIME = exports.AD_STALL_TIME = void 0;
var tslib_1 = require("tslib");
var time_1 = require("@adrise/utils/lib/time");
var tools_1 = require("./tools");
// The amount of time in ms that we wait after a timeupdate event before determining an ad has stalled
exports.AD_STALL_TIME = 3650;
// The amount of time in ms that we wait after a waiting event before determining an ad has stalled
exports.AD_WAITING_TIME = 8000;
// The maximum amount of successive timeupdate events after a waiting event we want to set a timeout
// for to detect an ad stall
var MAX_TIMEUPDATE_COUNT = 5;
var AdStallManager = /** @class */ (function () {
    function AdStallManager(options) {
        var _this = this;
        /**
         * Flag to check against in our 'timeupdate' cb to determine whether a 'waiting' event
         * preceded. It is possible for a few 'timeupdate' events to trigger after a 'waiting'
         * event, which we should consider as an ad stall once our timeout has expired
        */
        this.isWaiting = false;
        this.isPaused = false;
        this.isEnded = false;
        // Iterator to track the amount of timeupdate events in our setTimeout cb
        this.timeupdateCount = 0;
        // Used to track lag time to determine ad stall timeout
        this.lastTimeupdateTs = null;
        this.lastPauseTs = null;
        this.stallDetectionTimeout = null;
        this.adStallDetected = false;
        this.onTimeupdate = function () {
            _this.lastTimeupdateTs = (0, time_1.now)();
            // Check if waiting event preceded before incrementing our timeupdateCount iterator
            if (_this.isWaiting) {
                _this.timeupdateCount++;
                /**
                 * Because it is possible that a only a few timeupdate events to fire after a waiting event
                 * for an unusual ad stall scenario, we check if this is the initial timeupdate event
                 * before setting our stall detection timeout
                 */
                if (_this.timeupdateCount <= MAX_TIMEUPDATE_COUNT) {
                    _this.setStallDetectionTimeout(_this.timeupdateCount);
                }
            }
        };
        this.onWaiting = function () {
            _this.isWaiting = true;
            _this.timeupdateCount = 0;
            _this.setStallDetectionTimeout(_this.timeupdateCount);
        };
        this.onPlay = function () {
            if (_this.lastPauseTs !== null && _this.lastTimeupdateTs !== null) {
                // Account for the time paused when play is resumed from a paused state
                var timeSinceLastPause = (0, time_1.timeDiffInMilliseconds)(_this.lastPauseTs, (0, time_1.now)());
                _this.lastTimeupdateTs += timeSinceLastPause;
            }
            _this.isPaused = false;
        };
        this.onPlaying = function () {
            _this.clearStallDetectionTimeout();
            _this.isWaiting = false;
            _this.isPaused = false;
            _this.adStallDetected = false;
            _this.isEnded = false;
            _this.lastTimeupdateTs = null;
            _this.lastPauseTs = null;
        };
        this.onPause = function () {
            _this.clearStallDetectionTimeout();
            _this.isWaiting = false;
            _this.isPaused = true;
            _this.lastPauseTs = (0, time_1.now)();
        };
        this.onEnded = function () {
            _this.clearStallDetectionTimeout();
            _this.isWaiting = false;
            _this.isEnded = true;
            _this.lastTimeupdateTs = null;
            _this.lastPauseTs = null;
        };
        /**
         * Sets the stall timeout with a callback that emit an 'adStall' if appropriate
         *
         * @param timeupdateCount - number of timeupdate events to check against
         * at the time of timeout expiration in order to emit an ad stall
         */
        this.setStallDetectionTimeout = function (timeupdateCount) {
            if (_this.adStallDetected || _this.isEnded)
                return;
            _this.clearStallDetectionTimeout();
            _this.stallDetectionTimeout = setTimeout(function () {
                if (_this.timeupdateCount === timeupdateCount) {
                    var bufferedTime = _this.getBufferedTime();
                    var _a = _this.ad, video = _a.video, duration = _a.duration, id = _a.id;
                    /* istanbul ignore next */
                    _this.onAdStallDetected(tslib_1.__assign({ ad: { video: video, duration: duration, id: id }, isTimeupdateStall: timeupdateCount > 0 && timeupdateCount <= MAX_TIMEUPDATE_COUNT, timeupdateCount: timeupdateCount, bufferedArray: (0, tools_1.transBufferedRangesIntoArray)(bufferedTime) || [] }, (0, tools_1.getVideoPlaybackQuality)(_this.videoElement)));
                    _this.adStallDetected = true;
                }
                _this.stallDetectionTimeout = null;
            }, timeupdateCount === 0 ? exports.AD_WAITING_TIME : exports.AD_STALL_TIME);
        };
        /**
         * Clears the stall detection timeout
         */
        this.clearStallDetectionTimeout = function () {
            if (_this.stallDetectionTimeout !== null) {
                clearTimeout(_this.stallDetectionTimeout);
                _this.stallDetectionTimeout = null;
            }
        };
        this.videoElement = options.videoElement;
        this.ad = options.ad;
        this.onAdStallDetected = options.onAdStallDetected;
        this.detachEvents = this.attachEvents();
    }
    AdStallManager.prototype.attachEvents = function () {
        var _this = this;
        var handlers = {
            timeupdate: this.onTimeupdate,
            waiting: this.onWaiting,
            play: this.onPlay,
            playing: this.onPlaying,
            pause: this.onPause,
            ended: this.onEnded,
        };
        for (var _i = 0, _a = Object.entries(handlers); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            this.videoElement.addEventListener(key, value);
        }
        return function () {
            for (var _i = 0, _a = Object.entries(handlers); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                _this.videoElement.removeEventListener(key, value);
            }
        };
    };
    AdStallManager.prototype.getAdStallDetected = function () {
        return this.adStallDetected;
    };
    AdStallManager.prototype.getBufferedTime = function () {
        /* istanbul ignore next */
        return this.videoElement.buffered.length ? this.videoElement.buffered : undefined;
    };
    Object.defineProperty(AdStallManager.prototype, "lagTime", {
        get: function () {
            if (!this.lastTimeupdateTs)
                return -1;
            var timeSinceLastTimeupdate = (0, time_1.timeDiffInMilliseconds)(this.lastTimeupdateTs, (0, time_1.now)());
            // Do not account for the duration the video was paused for in the lag time if we are paused
            if (this.lastPauseTs !== null && this.isPaused) {
                var timeSinceLastPause = (0, time_1.timeDiffInMilliseconds)(this.lastPauseTs, (0, time_1.now)());
                return Math.max(timeSinceLastTimeupdate - timeSinceLastPause, -1);
            }
            return Math.max(timeSinceLastTimeupdate, -1);
        },
        enumerable: false,
        configurable: true
    });
    AdStallManager.prototype.destroy = function () {
        this.clearStallDetectionTimeout();
        this.detachEvents();
    };
    return AdStallManager;
}());
exports.AdStallManager = AdStallManager;
//# sourceMappingURL=AdStallManager.js.map