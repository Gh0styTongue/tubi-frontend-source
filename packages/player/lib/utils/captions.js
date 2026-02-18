"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCaptionIndex = exports.parseSrt = exports.locate = exports.convertStyleObjectToString = exports.fetchData = exports.CACHE_CAPACITY = void 0;
var fetchWrapper_1 = require("./fetchWrapper");
// Use a simple FIFO cache capacity control strategy
exports.CACHE_CAPACITY = 5;
var cacheKeyList = [];
var cache = {};
/**
 * fetch captions data from server side
 * @param url captions url
 *
 */
var fetchData = function (url, enableFetchWrapper, useNativeCpationsCache) {
    // build a promise that fetches srt file and returns the content parsed into JSON
    if (!cache[url]) {
        var result_1 = (0, fetchWrapper_1.fetchWrapper)(url, {}, !!enableFetchWrapper).then(function (response) {
            return response.text().then(function (text) {
                // ensure an empty body will be visible upstream; caller
                // is expected to log this error
                if (text.length === 0)
                    throw new Error('empty response body');
                if (!useNativeCpationsCache) {
                    cache[url] = result_1;
                    cacheKeyList.push(url);
                    if (cacheKeyList.length > exports.CACHE_CAPACITY) {
                        var legacyKey = cacheKeyList.shift();
                        delete cache[legacyKey];
                    }
                }
                var trimmed = text.trim();
                return trimmed[0] === '[' ? JSON.parse(trimmed) : (0, exports.parseSrt)(trimmed);
            });
        });
        return result_1;
    }
    return cache[url];
};
exports.fetchData = fetchData;
/**
 * transform {backgroundColor: #fff, color: #000} => "background-color:#fff;color:#000"
 * @param styles
 * @returns {string}
 */
var convertStyleObjectToString = function (styles) {
    var uppercasePattern = /([A-Z])/g;
    return Object.keys(styles)
        .map(function (key) {
        var stylePropValue = styles[key];
        var stylePropName = key.replace(uppercasePattern, '-$1').toLowerCase();
        return "".concat(stylePropName, ":").concat(stylePropValue, ";");
    })
        .join('');
};
exports.convertStyleObjectToString = convertStyleObjectToString;
/**
 * locate the right caption unit according to the time
 * @param time seconds
 * @param data
 */
var locate = function (time, data) {
    return data.find(function (unit) { return time * 1000 >= unit.start && time * 1000 <= unit.end; });
};
exports.locate = locate;
/**
 * parse srt content to data
 * @link https://en.wikipedia.org/wiki/SubRip
 */
var parseSrt = function (str) {
    var lines = str.trim().split(/\r\n|\n|\r/);
    var result = [];
    var item = {
        text: [],
    };
    var isTimeLine = function (line) { return line.indexOf(' --> ') !== -1; };
    var isIndexLine = function (line, index) { return /^\d+$/.test(line) && isTimeLine(lines[index + 1]); };
    var isEndLine = function (line, index) {
        return line === '' && (isIndexLine(lines[index + 1], index + 1) || index === lines.length - 1);
    };
    var parseTime = function (timeStr) {
        var chunks = timeStr.split(':');
        var secondChunks = chunks[2].split(',');
        var hours = parseInt(chunks[0], 10);
        var minutes = parseInt(chunks[1], 10);
        var seconds = parseInt(secondChunks[0], 10);
        var milliSeconds = parseInt(secondChunks[1], 10);
        return ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliSeconds;
    };
    // push a empty line to keep the logic simple
    lines.push('');
    lines.forEach(function (line, index) {
        if (isIndexLine(line, index)) {
            item.index = parseInt(line, 10);
        }
        else if (isTimeLine(line)) {
            var times = line.split(' --> ');
            item.start = parseTime(times[0]);
            item.end = parseTime(times[1]);
        }
        else if (isEndLine(line, index)) {
            result.push(item);
            item = {
                text: [],
            };
        }
        else {
            item.text.push(line);
        }
    });
    return result;
};
exports.parseSrt = parseSrt;
function getCaptionIndex(captionsList, defaultCaptions) {
    return captionsList.findIndex(function (captions) { return captions.lang === defaultCaptions; });
}
exports.getCaptionIndex = getCaptionIndex;
//# sourceMappingURL=captions.js.map