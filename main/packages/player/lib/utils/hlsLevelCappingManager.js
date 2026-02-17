"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var levels_1 = require("./levels");
var constants_1 = require("../constants");
var HlsLevelCappingManager = /** @class */ (function () {
    function HlsLevelCappingManager(options) {
        var _this = this;
        this.restrictedLevels = [];
        this.onManifestParsed = function (_event, data) {
            _this.restrictedLevels = [];
            var availableLevels = data.levels;
            // Find and remove levels that exceed maxLevelResolution
            for (var i = availableLevels.length - 1; i >= 0; i--) {
                var qualityLevel = (0, levels_1.convertHLSLevelToQualityLevelInfo)(availableLevels[i]);
                if (qualityLevel.height > _this.maxLevelResolution) {
                    _this.hls.removeLevel(i);
                    data.levels.splice(i, 1);
                    _this.restrictedLevels.push(qualityLevel);
                }
            }
            if (_this.restrictedLevels.length) {
                _this.playerEventEmitter.emit(constants_1.PLAYER_EVENTS.restrictedQualityListChange, {
                    restrictedLevels: _this.restrictedLevels,
                });
            }
            // Update the autoLevelCapping to the highest allowed level
            _this.hls.autoLevelCapping = data.levels.length - 1;
        };
        this.hls = options.hls;
        this.Hls = options.Hls;
        this.maxLevelResolution = options.maxLevelResolution;
        this.playerEventEmitter = options.playerEventEmitter;
        this.detachHlsEvents = this.attachHlsEvents();
    }
    HlsLevelCappingManager.prototype.attachHlsEvents = function () {
        var _this = this;
        var Hls = this.Hls;
        this.hls.on(Hls.Events.MANIFEST_PARSED, this.onManifestParsed);
        return function () {
            /* istanbul ignore next */
            if (!_this.hls)
                return;
            _this.hls.off(Hls.Events.MANIFEST_PARSED, _this.onManifestParsed);
        };
    };
    HlsLevelCappingManager.prototype.destroy = function () {
        this.detachHlsEvents();
    };
    return HlsLevelCappingManager;
}());
exports.default = HlsLevelCappingManager;
//# sourceMappingURL=hlsLevelCappingManager.js.map