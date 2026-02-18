"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BufferState = void 0;
var tslib_1 = require("tslib");
var bolaRule_1 = tslib_1.__importDefault(require("./rules/bolaRule"));
var insufficientBufferRule_1 = tslib_1.__importDefault(require("./rules/insufficientBufferRule"));
var switchHistoryRule_1 = tslib_1.__importDefault(require("./rules/switchHistoryRule"));
var throughputRule_1 = tslib_1.__importDefault(require("./rules/throughputRule"));
var switchRequestHistory_1 = tslib_1.__importDefault(require("./switchRequestHistory"));
var tools_1 = require("../utils/tools");
var BufferState;
(function (BufferState) {
    BufferState["BUFFER_LOADED"] = "BUFFER_LOADED";
    BufferState["BUFFER_EMPTY"] = "BUFFER_EMPTY";
})(BufferState = exports.BufferState || (exports.BufferState = {}));
var STALL_THRESHOLD = 0.3; // 300ms
var QUALITY_SWITCH_RULES = {
    THROUGHPUT: throughputRule_1.default,
    INSUFFICIENT_BUFFER: insufficientBufferRule_1.default,
    SWITCH_HISTORY: switchHistoryRule_1.default,
    BOLA: bolaRule_1.default,
};
var getAbrControllerCls = function (HlsCls) {
    var Events = HlsCls.Events;
    var originalController = HlsCls.DefaultConfig.abrController;
    // We don't directly extends hls.js AbrController, because we need to rewrite some methods but cannot use its existed private properties.
    // So we create a new class here and implement its interface about public methods.
    // We keep some basic logic from hls.js AbrController, and add `rules` logic which is a plugin mechanism for more ABR algorithms.
    var CustomAbrController = /** @class */ (function () {
        /** ************************** custom properties ************************** */
        function CustomAbrController(hls) {
            var _this = this;
            this.lastLevelLoadSec = 0;
            this.lastLoadedFragLevel = -1;
            this.firstSelection = -1;
            this._nextAutoLevel = -1;
            this.nextAutoLevelKey = '';
            this.timer = -1;
            this.fragCurrent = null;
            this.partCurrent = null;
            this.qualitySwitchRules = [];
            this.currentBufferState = BufferState.BUFFER_EMPTY;
            this._onWaiting = function () {
                _this._updateBufferState();
            };
            this._onPlaying = function () {
                _this._updateBufferState();
            };
            this._onSeeking = function () {
                _this.qualitySwitchRules.forEach(function (rule) {
                    var _a;
                    (_a = rule.onSeeking) === null || _a === void 0 ? void 0 : _a.call(rule);
                });
            };
            this._abandonRulesCheck = function () {
                originalController.prototype._abandonRulesCheck.call(_this);
            };
            this.hls = hls;
            this.bwEstimator = this.initEstimator();
            this.registerListeners();
            this.log = hls.config.debug ? (0, tools_1.debug)('AbrController') : function () { };
            this.switchRequestHistory = new switchRequestHistory_1.default(); // this is to record automatic switch level history, which is used by SwitchHistoryRule
            this._updateRules(); // initialize ABR rules/algorithms
        }
        CustomAbrController.prototype.resetEstimator = function (abrEwmaDefaultEstimate) {
            originalController.prototype.resetEstimator.call(this, abrEwmaDefaultEstimate);
        };
        CustomAbrController.prototype.initEstimator = function () {
            return originalController.prototype.initEstimator.call(this);
        };
        CustomAbrController.prototype.registerListeners = function () {
            var hls = this.hls;
            originalController.prototype.registerListeners.call(this);
            hls.on(Events.MEDIA_ATTACHED, this._onMediaAttached, this);
            hls.on(Events.MEDIA_DETACHED, this._onMediaDetached, this);
            hls.on(Events.BUFFER_FLUSHED, this._onBufferFlushed, this);
            hls.on(Events.BUFFER_RESET, this._onBufferReset, this);
            hls.on(Events.BUFFER_APPENDED, this._onBufferAppended, this);
            hls.on(Events.FRAG_LOAD_EMERGENCY_ABORTED, this._onFragLoadEmergencyAborted, this);
        };
        CustomAbrController.prototype.unregisterListeners = function () {
            var hls = this.hls;
            originalController.prototype.unregisterListeners.call(this);
            hls.off(Events.MEDIA_ATTACHED, this._onMediaAttached, this);
            hls.off(Events.MEDIA_DETACHED, this._onMediaDetached, this);
            hls.off(Events.BUFFER_FLUSHED, this._onBufferFlushed, this);
            hls.off(Events.BUFFER_RESET, this._onBufferReset, this);
            hls.off(Events.BUFFER_APPENDED, this._onBufferAppended, this);
            hls.off(Events.FRAG_LOAD_EMERGENCY_ABORTED, this._onFragLoadEmergencyAborted, this);
        };
        CustomAbrController.prototype.destroy = function () {
            originalController.prototype.destroy.call(this);
            this.switchRequestHistory.reset();
        };
        CustomAbrController.prototype.onManifestLoading = function () {
            originalController.prototype.onManifestLoading.call(this);
        };
        CustomAbrController.prototype.onLevelsUpdated = function () {
            originalController.prototype.onLevelsUpdated.call(this);
        };
        CustomAbrController.prototype.onMaxAutoLevelUpdated = function () {
            originalController.prototype.onMaxAutoLevelUpdated.call(this);
        };
        CustomAbrController.prototype.onFragLoading = function (event, data) {
            originalController.prototype.onFragLoading.call(this, event, data);
        };
        CustomAbrController.prototype.onLevelSwitching = function () {
            originalController.prototype.onLevelSwitching.call(this);
        };
        CustomAbrController.prototype.onError = function (event, data) {
            originalController.prototype.onError.call(this, event, data);
        };
        CustomAbrController.prototype.getTimeToLoadFrag = function (timeToFirstByteSec, bandwidth, fragSizeBits, isSwitch) {
            return originalController.prototype.getTimeToLoadFrag.call(this, timeToFirstByteSec, bandwidth, fragSizeBits, isSwitch);
        };
        CustomAbrController.prototype.onLevelLoaded = function (event, data) {
            originalController.prototype.onLevelLoaded.call(this, event, data);
        };
        CustomAbrController.prototype.onFragBuffered = function (event, data) {
            originalController.prototype.onFragBuffered.call(this, event, data);
            this._updateBufferState();
        };
        CustomAbrController.prototype.onFragLoaded = function (event, data) {
            var _this = this;
            originalController.prototype.onFragLoaded.call(this, event, data);
            // Notify rules about fragment loaded event
            this.qualitySwitchRules.forEach(function (rule) {
                var _a;
                (_a = rule.onFragmentLoaded) === null || _a === void 0 ? void 0 : _a.call(rule, _this, data);
            });
        };
        CustomAbrController.prototype._onMediaAttached = function () {
            var hls = this.hls;
            var media = hls.media;
            /* istanbul ignore if: safety check only */
            if (!media) {
                return;
            }
            media.addEventListener('waiting', this._onWaiting);
            media.addEventListener('playing', this._onPlaying);
            media.addEventListener('seeking', this._onSeeking);
        };
        CustomAbrController.prototype._onMediaDetached = function () {
            var hls = this.hls;
            var media = hls.media;
            /* istanbul ignore if: safety check only */
            if (!media) {
                return;
            }
            media.removeEventListener('waiting', this._onWaiting);
            media.removeEventListener('playing', this._onPlaying);
            media.removeEventListener('seeking', this._onSeeking);
        };
        CustomAbrController.prototype._onBufferFlushed = function () {
            this._updateBufferState();
        };
        CustomAbrController.prototype._onBufferReset = function () {
            this._updateBufferState();
        };
        CustomAbrController.prototype._onBufferAppended = function (event, data) {
            this.qualitySwitchRules.forEach(function (rule) {
                var _a;
                (_a = rule.onBufferAppended) === null || _a === void 0 ? void 0 : _a.call(rule, data);
            });
        };
        CustomAbrController.prototype._onFragLoadEmergencyAborted = function (event, data) {
            var _this = this;
            this.qualitySwitchRules.forEach(function (rule) {
                var _a;
                (_a = rule.onFragmentLoadingAbandoned) === null || _a === void 0 ? void 0 : _a.call(rule, _this, data);
            });
            this.switchRequestHistory.reset();
        };
        CustomAbrController.prototype.ignoreFragment = function (frag) {
            return originalController.prototype.ignoreFragment.call(this, frag);
        };
        CustomAbrController.prototype.clearTimer = function () {
            originalController.prototype.clearTimer.call(this);
        };
        Object.defineProperty(CustomAbrController.prototype, "firstAutoLevel", {
            // In this method, we replace hls.js abr-controller `findBestLevel` method with custom `_findBestLevel` method
            get: function () {
                var _a = this.hls, maxAutoLevel = _a.maxAutoLevel, minAutoLevel = _a.minAutoLevel;
                var abrAutoLevel = this._findBestLevel();
                if (abrAutoLevel > -1) {
                    return abrAutoLevel;
                }
                var firstLevel = this.hls.firstLevel;
                var clamped = Math.min(Math.max(firstLevel, minAutoLevel), maxAutoLevel);
                this.log("[abr] Could not find best starting auto level. Defaulting to first in playlist ".concat(firstLevel, " clamped to ").concat(clamped));
                return clamped;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CustomAbrController.prototype, "forcedAutoLevel", {
            get: function () {
                var descriptor = Object.getOwnPropertyDescriptor(originalController.prototype, 'forcedAutoLevel');
                /* istanbul ignore else: safety check only */
                if (descriptor && typeof descriptor.get === 'function') {
                    return descriptor.get.call(this);
                }
                return -1;
            },
            enumerable: false,
            configurable: true
        });
        Object.defineProperty(CustomAbrController.prototype, "nextAutoLevel", {
            // return next auto level
            get: function () {
                var descriptor = Object.getOwnPropertyDescriptor(originalController.prototype, 'nextAutoLevel');
                /* istanbul ignore else: safety check only */
                if (descriptor && typeof descriptor.get === 'function') {
                    return descriptor.get.call(this);
                }
                return -1;
            },
            set: function (nextLevel) {
                var descriptor = Object.getOwnPropertyDescriptor(originalController.prototype, 'nextAutoLevel');
                /* istanbul ignore else: safety check only */
                if (descriptor && typeof descriptor.set === 'function') {
                    descriptor.set.call(this, nextLevel);
                }
            },
            enumerable: false,
            configurable: true
        });
        CustomAbrController.prototype.getAutoLevelKey = function () {
            return originalController.prototype.getAutoLevelKey.call(this);
        };
        // In this method, we use custom `_findBestLevel` method
        CustomAbrController.prototype.getNextABRAutoLevel = function () {
            var hls = this.hls;
            var minAutoLevel = hls.minAutoLevel;
            var bestLevel = this._findBestLevel();
            if (bestLevel !== -1) {
                return bestLevel;
            }
            // If no matching level found, see if min auto level would be a better option
            var minLevel = hls.levels[minAutoLevel];
            var autoLevel = hls.levels[hls.loadLevel];
            if ((minLevel === null || minLevel === void 0 ? void 0 : minLevel.bitrate) < (autoLevel === null || autoLevel === void 0 ? void 0 : autoLevel.bitrate)) {
                return minAutoLevel;
            }
            // or if bitrate is not lower, continue to use loadLevel
            return hls.loadLevel;
        };
        CustomAbrController.prototype.getStarvationDelay = function () {
            return originalController.prototype.getStarvationDelay.call(this);
        };
        CustomAbrController.prototype.getBwEstimate = function () {
            return originalController.prototype.getBwEstimate.call(this);
        };
        CustomAbrController.prototype._updateRules = function () {
            var _this = this;
            this.qualitySwitchRules = Object.keys(QUALITY_SWITCH_RULES).map(function (ruleName) {
                return _this._createRuleInstance(ruleName);
            });
        };
        CustomAbrController.prototype._createRuleInstance = function (ruleName) {
            return new QUALITY_SWITCH_RULES[ruleName](this);
        };
        CustomAbrController.prototype._getRulesWithChange = function (srArray) {
            return srArray.filter(function (sr) { return sr.level !== undefined; });
        };
        // We conservatively choose the lowest bitrate level from the multiple ABR rules results
        CustomAbrController.prototype._getMinSwitchRequest = function (srArray) {
            var hls = this.hls;
            var levels = hls.levels;
            var currentSwitchRequestResult;
            for (var _i = 0, srArray_1 = srArray; _i < srArray_1.length; _i++) {
                var sr = srArray_1[_i];
                if (sr.level === undefined) {
                    continue;
                }
                if (currentSwitchRequestResult === undefined) {
                    currentSwitchRequestResult = sr;
                }
                else {
                    var currentLevel = levels[currentSwitchRequestResult.level];
                    var newLevel = levels[sr.level];
                    if (newLevel.bitrate < currentLevel.bitrate) {
                        currentSwitchRequestResult = sr;
                    }
                }
            }
            return currentSwitchRequestResult;
        };
        CustomAbrController.prototype._findBestLevel = function () {
            var _this = this;
            var loadLevel = this.hls.loadLevel;
            var lastLoadedFragLevel = this.lastLoadedFragLevel;
            var firstSelection = loadLevel === -1 || lastLoadedFragLevel === -1;
            if (firstSelection) {
                if (this.firstSelection !== -1) {
                    return this.firstSelection;
                }
            }
            // Get multiple ABR rules/algorithms results
            var switchRequestResultArray = this.qualitySwitchRules.map(function (rule) { return rule.getSwitchRequestResult(_this); });
            // Filter out useless results
            var activeRules = this._getRulesWithChange(switchRequestResultArray);
            // Conservatively choose the result which is the lowest bitrate level
            var minSwitchRequestResult = this._getMinSwitchRequest(activeRules);
            if ((minSwitchRequestResult === null || minSwitchRequestResult === void 0 ? void 0 : minSwitchRequestResult.level) !== undefined) {
                // Record the switch request history, used by SwitchHistoryRule
                this.switchRequestHistory.push(loadLevel, minSwitchRequestResult.level);
            }
            var bestLevel = (minSwitchRequestResult === null || minSwitchRequestResult === void 0 ? void 0 : minSwitchRequestResult.level) !== undefined ? minSwitchRequestResult.level : -1;
            if (firstSelection) {
                this.firstSelection = bestLevel;
            }
            return bestLevel;
        };
        CustomAbrController.prototype._updateBufferState = function () {
            var hls = this.hls;
            var media = hls.media;
            /* istanbul ignore if: safety check only */
            if (!media) {
                return;
            }
            var bufferLevel = this.getBufferLevel();
            var isNearEndBufferingCompleted = media.duration - media.currentTime <= STALL_THRESHOLD && bufferLevel >= media.duration - media.currentTime;
            if (bufferLevel <= STALL_THRESHOLD && !isNearEndBufferingCompleted) {
                this.currentBufferState = BufferState.BUFFER_EMPTY;
                // Notify rules about buffer empty event
                this.qualitySwitchRules.forEach(function (rule) {
                    var _a;
                    (_a = rule.onBufferEmpty) === null || _a === void 0 ? void 0 : _a.call(rule);
                });
            }
            else {
                this.currentBufferState = BufferState.BUFFER_LOADED;
            }
        };
        /** ************************** public methods for rules to call ************************** */
        CustomAbrController.prototype.getBufferState = function () {
            return this.currentBufferState;
        };
        // We can also call it `getBufferLength`. The name `getBufferLevel` is from dash.js
        CustomAbrController.prototype.getBufferLevel = function () {
            var hls = this.hls;
            var media = hls.media, config = hls.config;
            /* istanbul ignore if: safety check only */
            if (!media) {
                return 0;
            }
            var position = media.currentTime;
            var bufferedRange = (0, tools_1.transBufferedRangesIntoArray)(media.buffered);
            return Math.max((0, tools_1.getBufferedInfo)(bufferedRange, position, config.maxBufferHole).len, 0);
        };
        // Find a level which bitrate is lower than the throughput and closest to the throughput
        CustomAbrController.prototype.getOptimalLevelForBitrate = function (bitrateInKbit) {
            var _a = this.hls, levels = _a.levels, minAutoLevel = _a.minAutoLevel, maxAutoLevel = _a.maxAutoLevel;
            if (bitrateInKbit <= 0) {
                return minAutoLevel;
            }
            for (var i = maxAutoLevel; i >= minAutoLevel; i--) {
                if (levels[i].bitrate <= bitrateInKbit * 1000) {
                    return i;
                }
            }
            return minAutoLevel;
        };
        CustomAbrController.prototype.getThroughput = function () {
            return this.getBwEstimate();
        };
        CustomAbrController.prototype.getSafeThroughput = function () {
            return this.getThroughput() * this.hls.config.abrBandWidthUpFactor;
        };
        CustomAbrController.prototype.getLatency = function () {
            return this.bwEstimator.getEstimateTTFB();
        };
        CustomAbrController.prototype.getHls = function () {
            return this.hls;
        };
        CustomAbrController.prototype.getSwitchRequestHistory = function () {
            return this.switchRequestHistory;
        };
        return CustomAbrController;
    }());
    return CustomAbrController;
};
exports.default = getAbrControllerCls;
//# sourceMappingURL=abrController.js.map