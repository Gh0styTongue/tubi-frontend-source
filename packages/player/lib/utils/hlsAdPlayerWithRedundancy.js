"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var hlsAdPlayer_1 = tslib_1.__importDefault(require("./hlsAdPlayer"));
/**
 * This is not a progressive mp4 ad player.
 * This class uses MPEG-TS To play ads.
 */
var HlsAdPlayerWithRedundancy = /** @class */ (function (_super) {
    tslib_1.__extends(HlsAdPlayerWithRedundancy, _super);
    // eslint-disable-next-line @typescript-eslint/no-useless-constructor
    function HlsAdPlayerWithRedundancy(options) {
        return _super.call(this, options) || this;
    }
    HlsAdPlayerWithRedundancy.prototype.getLoadedXHR = function (url, context, retries, timeout) {
        var _this = this;
        if (retries === void 0) { retries = 0; }
        if (timeout === void 0) { timeout = 0; }
        return new Promise(function (resolve) {
            var xhr = _this.activeRequest = new XMLHttpRequest();
            xhr.open('GET', url);
            if (timeout) {
                xhr.timeout = timeout;
            }
            if (context === 'segment') {
                xhr.responseType = 'arraybuffer';
            }
            xhr.onabort = function () {
                _this.activeRequest = undefined;
                resolve({ type: 'abort', retry: false, xhr: xhr });
            };
            xhr.onload = function () {
                _this.activeRequest = undefined;
                resolve({ type: 'load', retry: xhr.status < 200 || xhr.status >= 400, xhr: xhr });
            };
            xhr.onerror = function () {
                _this.activeRequest = undefined;
                resolve({ type: 'error', retry: true, xhr: xhr });
            };
            xhr.ontimeout = function () {
                _this.activeRequest = undefined;
                resolve({ type: 'timeout', retry: true, xhr: xhr });
            };
            xhr.send();
        }).then(function (response) {
            if ((response.retry && retries === 0) || response.type === 'abort') {
                return Promise.reject(new Error("error downloading ".concat(context, " ").concat(response.type, " ").concat(url, " ").concat(response.xhr.status)));
            }
            if (response.retry) {
                return _this.getLoadedXHR(url, context, retries - 1, _this.options.networkTimeout);
            }
            return response.xhr;
        });
    };
    HlsAdPlayerWithRedundancy.prototype.shouldUseQueueImpressions = function () {
        return true;
    };
    HlsAdPlayerWithRedundancy.prototype.fetchMainManifest = function (adUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var xhr;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getLoadedXHR(adUrl, 'manifest', this.options.networkRetries, this.getFirstTimeout(0))];
                    case 1:
                        xhr = _a.sent();
                        return [2 /*return*/, this.getLevelFromManifest(adUrl, xhr.responseText)];
                }
            });
        });
    };
    HlsAdPlayerWithRedundancy.prototype.fetchVariant = function (variantUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var xhr;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getLoadedXHR(variantUrl, 'variant', this.options.networkRetries, this.getFirstTimeout(0))];
                    case 1:
                        xhr = _a.sent();
                        return [2 /*return*/, this.getMetadataFromVariant(variantUrl, xhr.responseText)];
                }
            });
        });
    };
    HlsAdPlayerWithRedundancy.prototype.getFirstTimeout = function (durationDownloaded) {
        var _a;
        var timeout = (_a = this.options.networkTimeout) !== null && _a !== void 0 ? _a : 0;
        var adPosition = this.getAdPosition();
        if (timeout > 0 && adPosition !== undefined) {
            timeout = Math.max(timeout, Math.floor((durationDownloaded - adPosition) * 1000));
        }
        return timeout;
    };
    HlsAdPlayerWithRedundancy.prototype.downloadSegment = function (url, durationDownloaded) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var xhr;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getLoadedXHR(url, 'segment', this.options.networkRetries, this.getFirstTimeout(durationDownloaded))];
                    case 1:
                        xhr = _a.sent();
                        return [2 /*return*/, xhr.response];
                }
            });
        });
    };
    HlsAdPlayerWithRedundancy.prototype.downloadSegments = function (variant, transmuxer) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var lastSegmentDownloaded, downloadSegmentIndex, durationDownloaded, flushSegmentToTransmuxer, downloadSegmentAndFlush;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        downloadSegmentIndex = 0;
                        durationDownloaded = 0;
                        flushSegmentToTransmuxer = function () {
                            if (lastSegmentDownloaded) {
                                durationDownloaded += variant.segments[downloadSegmentIndex - 1].duration;
                                try {
                                    transmuxer.push(new Uint8Array(lastSegmentDownloaded));
                                    transmuxer.flush();
                                }
                                catch (e) {
                                    throw new Error("error transmuxing segment ".concat(variant.segments[downloadSegmentIndex - 1].url, " ").concat(String(e)));
                                }
                            }
                        };
                        downloadSegmentAndFlush = function () {
                            var segment = _this.downloadSegment(variant.segments[downloadSegmentIndex].url, durationDownloaded);
                            // run transmuxing in parallel with downloading segment, it will block thread
                            // while here the XMLHttpRequest from call to `downloadSegment` is sent.
                            flushSegmentToTransmuxer();
                            return segment;
                        };
                        _a.label = 1;
                    case 1:
                        if (!(downloadSegmentIndex < variant.segments.length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, downloadSegmentAndFlush()];
                    case 2:
                        // eslint-disable-next-line no-await-in-loop
                        lastSegmentDownloaded = _a.sent();
                        _a.label = 3;
                    case 3:
                        downloadSegmentIndex++;
                        return [3 /*break*/, 1];
                    case 4:
                        flushSegmentToTransmuxer();
                        return [2 /*return*/];
                }
            });
        });
    };
    HlsAdPlayerWithRedundancy.prototype.downloadAndAppendSegments = function (variant, buffer, mediaSource, transmuxer) {
        var _this = this;
        var onTransmuxerData = function (segment) {
            _this.onTransmuxerData(buffer, segment);
        };
        transmuxer.on('data', onTransmuxerData);
        var onBufferError;
        var onUpdateEnd;
        return Promise.all([
            new Promise(function (resolve, reject) {
                onBufferError = function () {
                    reject(new Error("error appending segment ".concat(_this.segmentsAppended, " to source buffer")));
                };
                buffer.addEventListener('error', onBufferError);
                onUpdateEnd = function () {
                    _this.onSourceBufferUpdateEnd(variant, buffer, mediaSource);
                    if (mediaSource.readyState === 'ended') {
                        resolve();
                    }
                };
                buffer.addEventListener('updateend', onUpdateEnd);
            }),
            this.downloadSegments(variant, transmuxer),
        ]).finally(function () {
            buffer.removeEventListener('error', onBufferError);
            buffer.removeEventListener('updateend', onUpdateEnd);
            transmuxer.off('data', onTransmuxerData);
        });
    };
    HlsAdPlayerWithRedundancy.prototype.setVideoElementSrcForAd = function (videoElement, adUrl) {
        var _this = this;
        this.currentAdUrl = adUrl;
        this.teardown();
        this.createMediaSourceAppendSegments(videoElement, adUrl)
            .catch(function (err) {
            _this.teardown();
            _this.currentAdUrl === adUrl && _this.getState() !== 'destroyed' && _this.onError(err);
        });
    };
    return HlsAdPlayerWithRedundancy;
}(hlsAdPlayer_1.default));
exports.default = HlsAdPlayerWithRedundancy;
//# sourceMappingURL=hlsAdPlayerWithRedundancy.js.map