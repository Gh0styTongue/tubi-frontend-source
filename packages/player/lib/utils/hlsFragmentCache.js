"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HlsFragmentCache = void 0;
var tslib_1 = require("tslib");
var tools_1 = require("./tools");
var MAX_FRAGMENTS_CACHE_DURATION = 70;
var MAX_FRAGMENTS_CACHE_COUNT = 40;
var HlsFragmentCache = /** @class */ (function () {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    function HlsFragmentCache() {
        var _this = this;
        this.log = function () { };
        this.fragmentsCacheList = {
            main: [],
            audio: [],
        };
        this.setDebug = function (isDebug) {
            _this.log = isDebug ? (0, tools_1.debug)('HlsFragmentCache') : function () { };
        };
        this.appendFragmentsCache = function (data) {
            var type = data.frag.type;
            if (!_this.fragmentsCacheList.hasOwnProperty(type)) {
                return;
            }
            if (data.frag.sn === 'initSegment') {
                // if we append init segment data, previous different level fragment data is useless
                // also need remove same init segment
                _this.cleanUnmatchedFragmentCache(data.frag);
            }
            _this.reduceFragmentCache(); // make cache data duration/count not exceed thresholds
            _this.fragmentsCacheList[data.frag.type].push(data);
        };
        this.getFragmentCacheData = function (frag) {
            var fragmentsCacheList = _this.fragmentsCacheList;
            var type = frag.type;
            if (!_this.fragmentsCacheList.hasOwnProperty(type)) {
                return undefined;
            }
            var result;
            for (var i = fragmentsCacheList[type].length - 1; i >= 0; i--) {
                var cacheData = fragmentsCacheList[type][i];
                if (cacheData.frag.type === frag.type &&
                    cacheData.frag.level === frag.level &&
                    cacheData.frag.sn === frag.sn) {
                    result = tslib_1.__assign({}, cacheData);
                    _this.log("load fragment from cached data type:".concat(frag.type, " level:").concat(frag.level, " sn:").concat(frag.sn));
                    break;
                }
            }
            return result;
        };
        this.reduceFragmentCacheByCurrentTime = function (currentTime) {
            var fragmentsCacheList = _this.fragmentsCacheList;
            Object.keys(fragmentsCacheList).forEach(function (type) {
                for (var i = fragmentsCacheList[type].length - 1; i >= 0; i--) {
                    var cacheData = fragmentsCacheList[type][i];
                    if (Math.ceil(cacheData.frag.end) < currentTime) {
                        _this.removeFragmentCacheByRange(type, i, i, false); // remove back cached data
                    }
                }
            });
        };
        this.reduceFragmentCache = function () {
            var fragmentsCacheList = _this.fragmentsCacheList;
            Object.keys(fragmentsCacheList).forEach(function (type) {
                var totalDuration = 0;
                for (var i = fragmentsCacheList[type].length - 1; i >= 0; i--) {
                    var cacheData = fragmentsCacheList[type][i];
                    if (cacheData.frag.sn !== 'initSegment') {
                        if (totalDuration + cacheData.frag.duration > MAX_FRAGMENTS_CACHE_DURATION || fragmentsCacheList[type].length - i > MAX_FRAGMENTS_CACHE_COUNT) {
                            _this.removeFragmentCacheByRange(type, 0, i, false); // remove old cached data
                            break;
                        }
                        else {
                            totalDuration += cacheData.frag.duration;
                        }
                    }
                }
            });
        };
        this.cleanUnmatchedFragmentCache = function (frag) {
            var fragmentsCacheList = _this.fragmentsCacheList;
            var type = frag.type;
            for (var i = fragmentsCacheList[type].length - 1; i >= 0; i--) {
                var cacheData = fragmentsCacheList[type][i];
                if (cacheData.frag.type === type &&
                    (cacheData.frag.level !== frag.level || cacheData.frag.sn === 'initSegment')) {
                    _this.removeFragmentCacheByRange(type, i, i); // remove different level fragment data and duplicate init segment data
                }
            }
        };
        this.removeFragmentCacheByRange = function (type, start, end, removeInitSegment) {
            if (removeInitSegment === void 0) { removeInitSegment = true; }
            var fragmentsCacheList = _this.fragmentsCacheList;
            for (var i = end; i >= start; i--) {
                if (fragmentsCacheList[type][i].frag.sn !== 'initSegment' || removeInitSegment) {
                    fragmentsCacheList[type].splice(i, 1);
                }
            }
        };
        this.clear = function () {
            var fragmentsCacheList = _this.fragmentsCacheList;
            Object.keys(fragmentsCacheList).forEach(function (type) {
                fragmentsCacheList[type] = [];
            });
        };
    }
    HlsFragmentCache.getInstance = function () {
        if (!this._instance) {
            this._instance = new HlsFragmentCache();
        }
        return this._instance;
    };
    return HlsFragmentCache;
}());
exports.HlsFragmentCache = HlsFragmentCache;
//# sourceMappingURL=hlsFragmentCache.js.map