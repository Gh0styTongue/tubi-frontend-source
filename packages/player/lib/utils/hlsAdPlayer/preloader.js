"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Preloader = void 0;
var tslib_1 = require("tslib");
var Preloader = /** @class */ (function () {
    function Preloader(xhr, manifestParser) {
        // while we are pre-loading we may need to
        // stop the pre-load function after an await
        this.stopped = false;
        this.xhr = xhr;
        this.manifestParser = manifestParser;
    }
    Preloader.prototype.isLoadingAd = function (ad) {
        return ad && this.loadingAd === ad;
    };
    Preloader.prototype.getLevel = function (ad) {
        if (this.isLoadingAd(ad)) {
            return this.level;
        }
    };
    Preloader.prototype.getMainManifestFetch = function (ad) {
        if (this.isLoadingAd(ad)) {
            return this.mainManifestFetch;
        }
    };
    Preloader.prototype.getVariant = function (ad) {
        if (this.isLoadingAd(ad)) {
            return this.variant;
        }
    };
    Preloader.prototype.getVariantFetch = function (ad) {
        if (this.isLoadingAd(ad)) {
            return this.variantFetch;
        }
    };
    Preloader.prototype.getFetchedSegments = function (ad) {
        if (this.isLoadingAd(ad)) {
            return this.fetchedSegments;
        }
    };
    Preloader.prototype.getSegmentFetch = function (ad) {
        if (this.isLoadingAd(ad)) {
            return this.segmentFetch;
        }
    };
    Preloader.prototype.clearWaitingForFetch = function () {
        if (this.waitingForFetch !== undefined) {
            clearTimeout(this.waitingForFetch);
            this.waitingForFetch = undefined;
        }
    };
    // frees all memory used by the pre-loader
    Preloader.prototype.empty = function () {
        this.stopped = false;
        this.level = undefined;
        this.mainManifestFetch = undefined;
        this.variant = undefined;
        this.variantFetch = undefined;
        this.fetchedSegments = undefined;
        this.segmentFetch = undefined;
        this.loadingAd = undefined;
        this.clearWaitingForFetch();
    };
    /**
     * If the pre-loader has a pending promise for a manifest, variant, or segment
     * we may need to abort it's request. When pre-loading we do not apply a timeout
     * but when we need to use the result we may need it within a certain time period.
     * This function is used to apply a timeout for a pending item. It assumes the caller
     * only calls to wait for one pending item simultaneously and errors otherwise.
     */
    Preloader.prototype.waitForFetch = function (promise, timeout) {
        var _this = this;
        if (this.waitingForFetch !== undefined) {
            return Promise.reject(new Error('only one request from pre-loader supported'));
        }
        return new Promise(function (resolve, reject) {
            _this.waitingForFetch = setTimeout(function () {
                _this.waitingForFetch = undefined;
                reject(new Error('timed out waiting for pre-loader'));
            }, timeout);
            promise.then(function (v) {
                _this.clearWaitingForFetch();
                resolve(v);
            }).catch(function (e) {
                _this.clearWaitingForFetch();
                // pre-loader has already rejected
                reject(e);
            });
        });
    };
    Preloader.prototype.stop = function () {
        this.stopped = true;
    };
    Preloader.prototype.preload = function (ad) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, _b, level, _c, _d, _i, _e, segment, arrayBuffer, _f;
            var _this = this;
            return tslib_1.__generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        // empty anything stored
                        this.empty();
                        this.loadingAd = ad;
                        // no next ad so we are done
                        if (!ad) {
                            return [2 /*return*/];
                        }
                        this.mainManifestFetch = this.xhr.load(ad, 'text', 1, 0)
                            .then(function (xhr) { return _this.manifestParser.getLevelFromManifest(ad, xhr.responseText); });
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 3, , 4]);
                        _a = this;
                        return [4 /*yield*/, this.mainManifestFetch];
                    case 2:
                        _a.level = _g.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _b = _g.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        this.mainManifestFetch = undefined;
                        if (!this.level || !this.isLoadingAd(ad) || this.stopped) {
                            return [2 /*return*/];
                        }
                        level = this.level;
                        this.variantFetch = this.xhr.load(level.variant, 'text', 1, 0)
                            .then(function (xhr) { return _this.manifestParser.getMetadataFromVariant(level.variant, xhr.responseText); });
                        _g.label = 5;
                    case 5:
                        _g.trys.push([5, 7, , 8]);
                        _c = this;
                        return [4 /*yield*/, this.variantFetch];
                    case 6:
                        _c.variant = _g.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        _d = _g.sent();
                        return [3 /*break*/, 8];
                    case 8:
                        this.variantFetch = undefined;
                        if (!this.variant || !this.isLoadingAd(ad) || this.stopped) {
                            return [2 /*return*/];
                        }
                        this.fetchedSegments = [];
                        _i = 0, _e = this.variant.segments;
                        _g.label = 9;
                    case 9:
                        if (!(_i < _e.length)) return [3 /*break*/, 15];
                        segment = _e[_i];
                        this.segmentFetch = this.xhr.load(segment.url, 'arraybuffer', 1, 0).then(function (xhr) { return xhr.response; });
                        arrayBuffer = void 0;
                        _g.label = 10;
                    case 10:
                        _g.trys.push([10, 12, , 13]);
                        return [4 /*yield*/, this.segmentFetch];
                    case 11:
                        // eslint-disable-next-line no-await-in-loop
                        arrayBuffer = _g.sent();
                        return [3 /*break*/, 13];
                    case 12:
                        _f = _g.sent();
                        return [3 /*break*/, 13];
                    case 13:
                        if (!arrayBuffer || !this.isLoadingAd(ad) || this.stopped) {
                            return [3 /*break*/, 15];
                        }
                        this.fetchedSegments.push(arrayBuffer);
                        _g.label = 14;
                    case 14:
                        _i++;
                        return [3 /*break*/, 9];
                    case 15:
                        this.segmentFetch = undefined;
                        return [2 /*return*/];
                }
            });
        });
    };
    return Preloader;
}());
exports.Preloader = Preloader;
//# sourceMappingURL=preloader.js.map