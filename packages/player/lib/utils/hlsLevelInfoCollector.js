"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tools_1 = require("./tools");
var HLSLevelInfoCollector = /** @class */ (function () {
    function HLSLevelInfoCollector(options) {
        this.hls = options.hls;
        this.Hls = options.Hls;
        this.frameInfoArrayForLevelSwitch = [];
        this.renditionInfoArrayForLevelSwitch = [];
        this.detachHlsEvents = this.attachHlsEvents();
    }
    HLSLevelInfoCollector.prototype.attachHlsEvents = function () {
        var _this = this;
        /* istanbul ignore next */
        if (this.detachHlsEvents)
            this.detachHlsEvents();
        /* istanbul ignore next */
        if (!this.hls)
            return function () { };
        var levelSwitchingListener = function () {
            _this.updateFrameArrayInfoForCurrentLevel();
        };
        var levelSwitchedListener = function (event, _a) {
            var level = _a.level;
            _this.updateEndTimeForLastRenditionInfo();
            _this.initRenditionInfoForCurrentLevel(level);
        };
        var Hls = this.Hls;
        this.hls.on(Hls.Events.LEVEL_SWITCHING, levelSwitchingListener);
        this.hls.on(Hls.Events.LEVEL_SWITCHED, levelSwitchedListener);
        return function () {
            /* istanbul ignore next */
            if (!_this.hls)
                return;
            _this.hls.off(Hls.Events.LEVEL_SWITCHING, levelSwitchingListener);
            _this.hls.off(Hls.Events.LEVEL_SWITCHED, levelSwitchedListener);
        };
    };
    HLSLevelInfoCollector.prototype.updateFrameArrayInfoForCurrentLevel = function () {
        /* istanbul ignore next */
        if (!this.hls) {
            return this.frameInfoArrayForLevelSwitch;
        }
        var currentFrameInfo = this.hls.frameInfoForCurrentLevel;
        if (currentFrameInfo) {
            this.frameInfoArrayForLevelSwitch.push(currentFrameInfo);
        }
    };
    HLSLevelInfoCollector.prototype.fetchAndResetFrameInfo = function () {
        this.updateFrameArrayInfoForCurrentLevel();
        var frameInfo = this.frameInfoArrayForLevelSwitch;
        this.frameInfoArrayForLevelSwitch = [];
        return frameInfo;
    };
    HLSLevelInfoCollector.prototype.initRenditionInfoForCurrentLevel = function (levelIndex) {
        var _a;
        if (!this.hls)
            return;
        var currentLevel = (_a = this.hls.levels) === null || _a === void 0 ? void 0 : _a[levelIndex];
        if (!currentLevel)
            return;
        var rendition = (0, tools_1.getRenditionFromHlsLevelInfo)(currentLevel);
        var renditionInfo = {
            rendition: rendition,
            codec: currentLevel.videoCodec,
            startTime: Date.now(),
            endTime: 0,
        };
        this.renditionInfoArrayForLevelSwitch.push(renditionInfo);
    };
    HLSLevelInfoCollector.prototype.updateEndTimeForLastRenditionInfo = function () {
        var length = this.renditionInfoArrayForLevelSwitch.length;
        if (length > 0) {
            var renditionInfo = this.renditionInfoArrayForLevelSwitch[length - 1];
            if (renditionInfo.endTime === 0) {
                renditionInfo.endTime = Date.now();
            }
        }
    };
    HLSLevelInfoCollector.prototype.fetchAndResetRenditionInfo = function () {
        this.updateEndTimeForLastRenditionInfo();
        var renditionInfo = this.renditionInfoArrayForLevelSwitch;
        this.renditionInfoArrayForLevelSwitch = [];
        return renditionInfo;
    };
    HLSLevelInfoCollector.prototype.destroy = function () {
        this.detachHlsEvents();
        this.frameInfoArrayForLevelSwitch = [];
        this.renditionInfoArrayForLevelSwitch = [];
    };
    return HLSLevelInfoCollector;
}());
exports.default = HLSLevelInfoCollector;
//# sourceMappingURL=hlsLevelInfoCollector.js.map