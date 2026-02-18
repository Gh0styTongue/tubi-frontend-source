"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormatResolution = void 0;
exports.getFormatResolutionValue = getFormatResolutionValue;
var FORMAT_RESOLUTION = {
    '4320P': 4320,
    '2160P': 2160,
    '1440P': 1440,
    '1080P': 1080,
    '720P': 720,
    '480P': 480,
    '360P': 360,
    '240P': 240,
    '144P': 144,
};
var getFormatResolution = function (width, height) {
    var realResolutionNumber = Math.min(width, height);
    if (realResolutionNumber <= 0)
        return 'UNKNOWN';
    var formatResolutionNumbers = Object.keys(FORMAT_RESOLUTION).map(function (key) { return FORMAT_RESOLUTION[key]; }).sort(function (a, b) { return a - b; });
    var resultNumber = formatResolutionNumbers[0];
    for (var i = 0; i < formatResolutionNumbers.length - 1; i++) {
        if (realResolutionNumber <= formatResolutionNumbers[i]) {
            resultNumber = formatResolutionNumbers[i];
            break;
        }
        else if (realResolutionNumber > formatResolutionNumbers[i] && realResolutionNumber < formatResolutionNumbers[i + 1]) {
            var previousDiff = realResolutionNumber - formatResolutionNumbers[i];
            var nextDiff = formatResolutionNumbers[i + 1] - realResolutionNumber;
            resultNumber = previousDiff < nextDiff ? formatResolutionNumbers[i] : formatResolutionNumbers[i + 1];
            break;
        }
        if (i === formatResolutionNumbers.length - 2) {
            resultNumber = formatResolutionNumbers[i + 1];
        }
    }
    var result = '144P';
    Object.keys(FORMAT_RESOLUTION).forEach(function (key) {
        if (FORMAT_RESOLUTION[key] === resultNumber) {
            result = key;
        }
    });
    return result;
};
exports.getFormatResolution = getFormatResolution;
function getFormatResolutionValue(width, height) {
    var result = (0, exports.getFormatResolution)(width, height);
    if (result === 'UNKNOWN')
        return -1;
    return FORMAT_RESOLUTION[result];
}
//# sourceMappingURL=getFormatResolution.js.map