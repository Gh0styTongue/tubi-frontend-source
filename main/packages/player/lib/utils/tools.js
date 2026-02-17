"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUrlHost = exports.getVideoPlaybackQuality = exports.isFatalNativeError = exports.getCDNProvider = exports.isAFTMMModel = exports.removeUndefined = exports.isDash = exports.isHls = exports.isPlayerDebugEnabled = exports.presetLastError = exports.getRenditionFromHlsLevelInfo = exports.timeInBufferedRange = exports.isTimeInBufferedRange = exports.mapBufferedRanges = exports.getClosestBufferedRanges = exports.isEmptyBuffer = exports.transBufferedRangesIntoArray = exports.formatSamsungUrl = exports.buildRenditionString = exports.sendBeaconRequest = exports.debug = exports.omit = exports.toRelativeProtocol = void 0;
var tslib_1 = require("tslib");
var constants_1 = require("../constants");
var BEACON_REQUEST_HAS_NO_ORIGIN = 'beaconRequestHasNoOrigin';
var toRelativeProtocol = function (url) {
    if (url === void 0) { url = ''; }
    var index = url.indexOf('://');
    return index !== -1 ? url.slice(index + 1) : url;
};
exports.toRelativeProtocol = toRelativeProtocol;
var omit = function (obj, fields) { return Object.keys(obj)
    .reduce(function (acc, key) {
    if (fields.indexOf(key) === -1) {
        acc[key] = obj[key];
    }
    return acc;
}, {}); };
exports.omit = omit;
var debug = function (name) { return function () {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    // FIXME find a better approach to handle debugging logs
    // eslint-disable-next-line no-console
    console.log.apply(console, tslib_1.__spreadArray(["[Player:".concat(name, "]")], args, true));
}; };
exports.debug = debug;
var ImageLoadQueue = /** @class */ (function () {
    function ImageLoadQueue() {
        var _this = this;
        this.beaconsToSend = [];
        this.sendingBeacon = false;
        this.doneSendBeacon = function () {
            _this.sendingBeacon = false;
            _this.trySendBeacon();
        };
        // intentionally empty to indicate private
    }
    ImageLoadQueue.getInstance = function () {
        if (!this.instance) {
            this.instance = new ImageLoadQueue();
        }
        return this.instance;
    };
    ImageLoadQueue.prototype.trySendBeacon = function () {
        if (this.sendingBeacon) {
            return;
        }
        var url = this.beaconsToSend.shift();
        if (!url) {
            return;
        }
        this.sendingBeacon = true;
        var image = new Image();
        image.onload = image.onerror = this.doneSendBeacon;
        image.src = url;
    };
    return ImageLoadQueue;
}());
/**
 * Reason for using image src here.
 * 1. Some third-party vendors could only accept the 'Get' method, so we can't use the sendBeacon method.
 * 2. Some URLs will have the CORS issue, so we can't use the fetch method.
 * 3. Duplicate impressions will cause calculation issues. So we can't chain multiple methods as a fallback.
 * @param urls
 * @param errorHandler
 */
function sendBeaconRequest(urls, errorHandler, useQueueImpressions) {
    for (var _i = 0, urls_1 = urls; _i < urls_1.length; _i++) {
        var url = urls_1[_i];
        if (url.indexOf('http') !== 0) {
            if (errorHandler) {
                errorHandler({
                    code: BEACON_REQUEST_HAS_NO_ORIGIN,
                    message: url,
                });
            }
            continue;
        }
        // Handle the cache-buster "macro" that may be present in some of the pixel URLs
        var formatUrl = url.replace('(ADRISE:CB)', "".concat(Date.now()));
        if (useQueueImpressions) {
            ImageLoadQueue.getInstance().beaconsToSend.push(formatUrl);
            ImageLoadQueue.getInstance().trySendBeacon();
            continue;
        }
        var img = new Image();
        img.src = formatUrl;
    }
}
exports.sendBeaconRequest = sendBeaconRequest;
// NOTE: this method is from https://bitbucket.org/npaw/lib-plugin-js/src/3f036d3802382b2d5d71a91a8a0258e17967e39a/src/util.js#lines-136
var buildRenditionString = function (options) {
    var width = options.width, height = options.height, _a = options.bitrate, bitrate = _a === void 0 ? null : _a;
    var ret = '';
    if (width && height) {
        ret = "".concat(width, "x").concat(height);
    }
    if (bitrate && !isNaN(bitrate) && bitrate >= 1) {
        if (ret) {
            ret += '@';
        }
        else {
            ret = '';
        }
        if (bitrate < 1e3) {
            ret += "".concat(Math.round(bitrate), "bps");
        }
        else if (bitrate < 1e6) {
            ret += "".concat(Math.round(bitrate / 1e3), "Kbps");
        }
        else {
            ret += "".concat(Math.round(bitrate / 1e4) / 1e2, "Mbps");
        }
    }
    return ret;
};
exports.buildRenditionString = buildRenditionString;
/**
 * samsung tv uses file protocol, it requires full url
 */
var formatSamsungUrl = function (url) {
    if (url.indexOf('http') !== 0) {
        return "http:".concat(url);
    }
    return url;
};
exports.formatSamsungUrl = formatSamsungUrl;
function transBufferedRangesIntoArray(buffered) {
    if (!buffered)
        return [];
    var ranges = [];
    for (var i = 0; i < buffered.length; i++) {
        ranges.push([Number(buffered.start(i).toFixed(2)), Number(buffered.end(i).toFixed(2))]);
    }
    return ranges;
}
exports.transBufferedRangesIntoArray = transBufferedRangesIntoArray;
function isEmptyBuffer(videoElement) {
    var buffered = videoElement.buffered;
    if (buffered.length === 0) {
        // On Comcast, the buffered.length will be 0 if video is not full loaded, but it not means the ad is empty.
        // So we need to check currentTime and readyState to determine if the ad is empty
        if (videoElement.currentTime > 0 && videoElement.readyState >= 3) {
            return false;
        }
        return true;
    }
    var startTime = buffered.start(0);
    var endTime = buffered.end(buffered.length - 1);
    if (startTime === endTime) {
        return true;
    }
    return false;
}
exports.isEmptyBuffer = isEmptyBuffer;
function getClosestBufferedRanges(bufferedArray, position) {
    var closestBefore = bufferedArray
        .filter(function (range) { return position >= range[1]; })
        .reduce(function (prev, curr) { return (prev[1] === curr[1] ?
        (prev[0] < curr[0] ? prev : curr) :
        (prev[1] > curr[1] ? prev : curr)); }, [-Infinity, -Infinity]);
    var closestAfter = bufferedArray
        .filter(function (range) { return position < range[0]; })
        .reduce(function (prev, curr) { return (prev[0] === curr[0] ?
        (prev[1] > curr[1] ? prev : curr) :
        (prev[0] < curr[0] ? prev : curr)); }, [Infinity, Infinity]);
    var hits = bufferedArray.filter(function (range) { return position >= range[0] && position < range[1]; });
    return tslib_1.__spreadArray(tslib_1.__spreadArray(tslib_1.__spreadArray([], (closestBefore[0] !== -Infinity ? [closestBefore] : []), true), hits, true), (closestAfter[0] !== Infinity ? [closestAfter] : []), true);
}
exports.getClosestBufferedRanges = getClosestBufferedRanges;
function mapBufferedRanges(bufferedArray, mapFunction) {
    var result = [];
    bufferedArray.forEach(function (range) {
        result.push(range.map(mapFunction));
    });
    return result;
}
exports.mapBufferedRanges = mapBufferedRanges;
function isTimeInBufferedRange(position, buffered) {
    if (position === undefined)
        return false;
    return buffered.some(function (_a) {
        var start = _a[0], end = _a[1];
        return start <= position && position < end;
    });
}
exports.isTimeInBufferedRange = isTimeInBufferedRange;
function timeInBufferedRange(position, buffered) {
    for (var _i = 0, buffered_1 = buffered; _i < buffered_1.length; _i++) {
        var range = buffered_1[_i];
        if (range[0] <= position && position < range[1]) {
            return range;
        }
    }
    return undefined;
}
exports.timeInBufferedRange = timeInBufferedRange;
function getRenditionFromHlsLevelInfo(level) {
    if (!level)
        return '';
    if (level.name) {
        return level.name;
    }
    /* istanbul ignore else */
    if (level.bitrate) {
        return (0, exports.buildRenditionString)({ width: level.width, height: level.height, bitrate: level.bitrate });
    }
    return '';
}
exports.getRenditionFromHlsLevelInfo = getRenditionFromHlsLevelInfo;
// Filter some basic error information for reports
function presetLastError(lastError) {
    var frag = lastError === null || lastError === void 0 ? void 0 : lastError.frag;
    if (frag) {
        return tslib_1.__assign(tslib_1.__assign({}, lastError), { frag: {
                duration: frag.duration,
                sn: frag.sn,
                level: frag.level,
                start: frag.start,
                stats: frag.stats,
                type: frag.type,
                endDTS: frag.endDTS,
                baseurl: frag.baseurl,
            } });
    }
    return lastError;
}
exports.presetLastError = presetLastError;
function isPlayerDebugEnabled(debugLevel) {
    if (!debugLevel)
        return false;
    return debugLevel !== constants_1.PLAYER_LOG_LEVEL.DISABLE;
}
exports.isPlayerDebugEnabled = isPlayerDebugEnabled;
var isHls = function (url) { return url.match(/\.m3u8(\?.*)?$/) !== null; };
exports.isHls = isHls;
var isDash = function (url) { return (/\.mpd(\?.*)?$/).test(url); };
exports.isDash = isDash;
var removeUndefined = function (obj) { return Object.keys(obj).reduce(function (result, key) {
    if (obj[key] !== undefined) {
        result[key] = obj[key];
    }
    return result;
}, {}); };
exports.removeUndefined = removeUndefined;
var isAFTMMModel = function () {
    return window.navigator.userAgent.includes('AFTMM ');
};
exports.isAFTMMModel = isAFTMMModel;
var getCDNProvider = function (originCDN) {
    if (originCDN === void 0) { originCDN = ''; }
    if (originCDN.includes('cloudfront')) {
        return 'cloudfront';
    }
    if (originCDN.includes('akamai')) {
        return 'akamai';
    }
    if (originCDN.includes('fastly')) {
        return 'fastly';
    }
    return originCDN;
};
exports.getCDNProvider = getCDNProvider;
var isFatalNativeError = function (errorCode) {
    return errorCode !== DOMException.ABORT_ERR;
};
exports.isFatalNativeError = isFatalNativeError;
var getVideoPlaybackQuality = function (videoElement) {
    if (typeof videoElement.getVideoPlaybackQuality === 'function') {
        var vpq = videoElement.getVideoPlaybackQuality();
        return {
            totalVideoFrames: vpq.totalVideoFrames,
            droppedVideoFrames: vpq.droppedVideoFrames,
            corruptedVideoFrames: vpq.corruptedVideoFrames,
        };
    }
    return {};
};
exports.getVideoPlaybackQuality = getVideoPlaybackQuality;
var getUrlHost = function (mediaUrl) {
    try {
        return new URL(mediaUrl).hostname;
    }
    catch (e) {
        return '';
    }
};
exports.getUrlHost = getUrlHost;
//# sourceMappingURL=tools.js.map