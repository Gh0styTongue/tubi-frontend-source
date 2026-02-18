"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertHLSLevelToQualityLevelInfo = void 0;
var tslib_1 = require("tslib");
var getQualityLevelLabel = function (level) {
    if (level.name) {
        return level.name;
    }
    var bitrateText = "".concat(Math.round(level.bitrate / 1024), "kb");
    return level.height ? "".concat(level.height, "p / ").concat(bitrateText) : bitrateText;
};
function convertHLSLevelToQualityLevelInfo(level) {
    var width = level.width, bitrate = level.bitrate;
    // correct height because crop happens during transcoding
    var height = Math.round(width * 9 / 16);
    var label = getQualityLevelLabel(tslib_1.__assign(tslib_1.__assign({}, level), { height: height }));
    return {
        width: width,
        height: height,
        label: label,
        bitrate: bitrate,
    };
}
exports.convertHLSLevelToQualityLevelInfo = convertHLSLevelToQualityLevelInfo;
//# sourceMappingURL=levels.js.map