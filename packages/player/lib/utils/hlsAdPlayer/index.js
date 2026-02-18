"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var progressiveMp4AdPlayer_1 = tslib_1.__importDefault(require("../progressiveMp4AdPlayer"));
var manifestParser_1 = require("./manifestParser");
var preloader_1 = require("./preloader");
var xhr_1 = require("./xhr");
var dom_1 = require("../dom");
/**
 * This is not a progressive mp4 ad player.
 * This class uses MPEG-TS To play ads.
 */
var HlsAdPlayer = /** @class */ (function (_super) {
    tslib_1.__extends(HlsAdPlayer, _super);
    function HlsAdPlayer(options) {
        var _this = _super.call(this, options) || this;
        _this.xhr = new xhr_1.Xhr();
        _this.removed = false;
        _this.options = options;
        _this.manifestParser = new manifestParser_1.ManifestParser(options);
        _this.preloader = new preloader_1.Preloader(_this.xhr, _this.manifestParser);
        return _this;
    }
    HlsAdPlayer.prototype.shouldUseQueueImpressions = function () {
        return true;
    };
    HlsAdPlayer.prototype.remove = function () {
        this.removed = true;
        _super.prototype.remove.call(this);
        this.clearObjectURL();
        this.preloader.empty();
        this.xhr.stop();
    };
    HlsAdPlayer.prototype.shouldStop = function (adSequence) {
        return this.removed || adSequence !== this.getAdSequence();
    };
    HlsAdPlayer.prototype.getVariant = function (srcSetTime, adUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var adSequence, level, variant;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        adSequence = this.getAdSequence();
                        return [4 /*yield*/, this.fetchMainManifest(srcSetTime, adUrl)];
                    case 1:
                        level = _a.sent();
                        if (this.shouldStop(adSequence)) {
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.fetchVariant(srcSetTime, adUrl, level.variant)];
                    case 2:
                        variant = _a.sent();
                        return [2 /*return*/, {
                                variant: variant,
                                level: level,
                            }];
                }
            });
        });
    };
    HlsAdPlayer.prototype.clearObjectURL = function () {
        if (this.objectURL !== undefined) {
            URL.revokeObjectURL(this.objectURL);
            this.objectURL = undefined;
        }
    };
    HlsAdPlayer.prototype.getMediaSource = function (videoElement, resolve, reject) {
        var _this = this;
        this.clearObjectURL();
        var mediaSource = new MediaSource();
        var removeEventListeners = function () {
            mediaSource.removeEventListener('sourceopen', onSourceOpen);
            mediaSource.removeEventListener('sourceclose', onSourceClose);
            _this.clearObjectURL();
        };
        var onSourceClose = function () {
            removeEventListeners();
            reject(new Error('media source closed before opening'));
        };
        var onSourceOpen = function () {
            removeEventListeners();
            resolve(mediaSource);
        };
        mediaSource.addEventListener('sourceopen', onSourceOpen);
        mediaSource.addEventListener('sourceclose', onSourceClose);
        this.objectURL = URL.createObjectURL(mediaSource);
        videoElement.src = this.objectURL;
    };
    HlsAdPlayer.prototype.getTotalDuration = function (variant) {
        var duration = 0;
        for (var _i = 0, _a = variant.segments; _i < _a.length; _i++) {
            var segment = _a[_i];
            duration += segment.duration;
        }
        return duration;
    };
    HlsAdPlayer.prototype.preload = function (ad) {
        if (!this.options.preloadAds) {
            return;
        }
        this.preloader.preload(ad);
    };
    HlsAdPlayer.prototype.createMediaSourceAppendSegments = function (videoElement, adUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var srcSetTime, adSequence, _a, variant, mediaSource, transmuxer, codecs, buffer;
            var _this = this;
            var _b;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (HlsAdPlayer.supportsMp2t === undefined) {
                            HlsAdPlayer.supportsMp2t = this.options.hlsAdsUseMp2t && MediaSource.isTypeSupported('video/mp2t');
                        }
                        if (!this.options.muxJS) {
                            throw new Error('must provide muxJS');
                        }
                        srcSetTime = Date.now();
                        adSequence = this.getAdSequence();
                        if (this.preloader.isLoadingAd(adUrl)) {
                            // we are now starting to load the current
                            // ad, the pre-loader should not continue
                            // pre-loading of any ad.
                            this.preloader.stop();
                        }
                        else {
                            // if we were loading another ad stop it's download
                            this.xhr.stop();
                        }
                        return [4 /*yield*/, Promise.all([
                                this.getVariant(srcSetTime, adUrl),
                                new Promise(function (resolve, reject) { return _this.getMediaSource(videoElement, resolve, reject); }),
                                !HlsAdPlayer.supportsMp2t ? this.options.muxJS().then(function (mp4Library) { return new mp4Library.Transmuxer({ remux: true, keepOriginalTimestamps: true }); }) : undefined,
                            ])];
                    case 1:
                        _a = _c.sent(), variant = _a[0], mediaSource = _a[1], transmuxer = _a[2];
                        // no longer loading this ad sequence
                        if (variant === undefined || this.shouldStop(adSequence)) {
                            return [2 /*return*/];
                        }
                        codecs = variant.level.codecs;
                        buffer = mediaSource.addSourceBuffer("video/mp".concat(HlsAdPlayer.supportsMp2t ? '2t' : '4', "; codecs=\"").concat(codecs, "\""));
                        mediaSource.duration = this.getTotalDuration(variant.variant);
                        return [4 /*yield*/, this.downloadAndAppendSegments(srcSetTime, adUrl, variant.variant, buffer, mediaSource, transmuxer)];
                    case 2:
                        _c.sent();
                        // no longer loading this ad sequence
                        if (this.shouldStop(adSequence)) {
                            return [2 /*return*/];
                        }
                        // current ad has downloaded and appended all segments
                        // can now start pre-loading the next ad
                        this.preload((_b = this.getNextAd()) === null || _b === void 0 ? void 0 : _b.video);
                        return [2 /*return*/];
                }
            });
        });
    };
    HlsAdPlayer.prototype.setVideoElementSrcForAd = function (videoElement, adUrl) {
        var _this = this;
        var adSequence = this.getAdSequence();
        this.createMediaSourceAppendSegments(videoElement, adUrl)
            .catch(function (err) {
            // only report the error if we haven't been removed
            // and are still the current ad sequence
            if (!_this.shouldStop(adSequence)) {
                _this.onError(err);
            }
        });
    };
    HlsAdPlayer.prototype.fetchMainManifest = function (srcSetTime, adUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var preloaderResult, preloaderMainManifestFetch, xhr;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        preloaderResult = this.preloader.getLevel(adUrl);
                        // if we have loaded this level already use it
                        if (preloaderResult) {
                            return [2 /*return*/, preloaderResult];
                        }
                        preloaderMainManifestFetch = this.preloader.getMainManifestFetch(adUrl);
                        // if we are already loading this level use it
                        if (preloaderMainManifestFetch !== undefined) {
                            return [2 /*return*/, this.preloader.waitForFetch(preloaderMainManifestFetch, this.getStartupTimeout(srcSetTime))];
                        }
                        return [4 /*yield*/, this.xhr.load(adUrl, 'text', 1, this.getStartupTimeout(srcSetTime))];
                    case 1:
                        xhr = _a.sent();
                        return [2 /*return*/, this.manifestParser.getLevelFromManifest(adUrl, xhr.responseText)];
                }
            });
        });
    };
    HlsAdPlayer.prototype.fetchVariant = function (srcSetTime, adUrl, variantUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var preloaderResult, preloaderVariantFetch, xhr;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        preloaderResult = this.preloader.getVariant(adUrl);
                        // if the pre-loader had variant
                        // we can use it
                        if (preloaderResult) {
                            return [2 /*return*/, preloaderResult];
                        }
                        preloaderVariantFetch = this.preloader.getVariantFetch(adUrl);
                        if (preloaderVariantFetch !== undefined) {
                            return [2 /*return*/, this.preloader.waitForFetch(preloaderVariantFetch, this.getStartupTimeout(srcSetTime))];
                        }
                        return [4 /*yield*/, this.xhr.load(variantUrl, 'text', 1, this.getStartupTimeout(srcSetTime))];
                    case 1:
                        xhr = _a.sent();
                        return [2 /*return*/, this.manifestParser.getMetadataFromVariant(variantUrl, xhr.responseText)];
                }
            });
        });
    };
    HlsAdPlayer.prototype.getStartupTimeout = function (srcSetTime) {
        var totalTimeout = this.getAdStallAtStartCheckTimeout();
        var remainingTimeToStartup = totalTimeout - (Date.now() - srcSetTime);
        if (remainingTimeToStartup <= 0) {
            throw new Error("failed to startup in under ".concat(totalTimeout, "ms"));
        }
        return remainingTimeToStartup;
    };
    HlsAdPlayer.prototype.getSegmentTimeout = function (srcSetTime, maxSegmentDuration, durationDownloaded) {
        var timeToStartupSec = (this.getAdStallAtStartCheckTimeout() - (Date.now() - srcSetTime)) / 1000;
        var adPosition = this.getAdPosition() || 0;
        return Math.max(
        // if we still have time left within the start-up timeout this
        // value could be larger than maxSegmentDuration. for cases
        // where durationDownloaded is 0 this value could be larger
        // than maxSegmentDuration
        timeToStartupSec, maxSegmentDuration, Math.floor((durationDownloaded - adPosition))) * 1000;
    };
    HlsAdPlayer.prototype.getMaximumDuration = function (variant) {
        var maximum = 0;
        for (var _i = 0, _a = variant.segments; _i < _a.length; _i++) {
            var segment = _a[_i];
            maximum = Math.max(segment.duration, maximum);
        }
        return maximum;
    };
    HlsAdPlayer.prototype.downloadSegment = function (srcSetTime, maxSegmentDuration, url, durationDownloaded) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var segmentTimeout, xhr;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        segmentTimeout = this.getSegmentTimeout(srcSetTime, maxSegmentDuration, durationDownloaded);
                        return [4 /*yield*/, this.xhr.load(url, 'arraybuffer', 1, segmentTimeout)];
                    case 1:
                        xhr = _a.sent();
                        return [2 /*return*/, xhr.response];
                }
            });
        });
    };
    HlsAdPlayer.prototype.downloadSegments = function (srcSetTime, adUrl, variant, transmuxer, onSegmentToAppend) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var lastSegmentDownloaded, downloadSegmentIndex, durationDownloaded, maxSegmentDuration, alreadyDownloadedSegments, alreadyDownloadingSegment, adSequence, flushSegmentToTransmuxer, downloadSegmentAndFlush;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        downloadSegmentIndex = 0;
                        durationDownloaded = 0;
                        maxSegmentDuration = this.getMaximumDuration(variant);
                        alreadyDownloadedSegments = this.preloader.getFetchedSegments(adUrl);
                        alreadyDownloadingSegment = this.preloader.getSegmentFetch(adUrl);
                        // we have pulled everything we are going to get from
                        // the pre-loader so here we can empty it.
                        this.preloader.empty();
                        adSequence = this.getAdSequence();
                        flushSegmentToTransmuxer = function () {
                            if (lastSegmentDownloaded) {
                                if (!transmuxer) {
                                    onSegmentToAppend(lastSegmentDownloaded);
                                    return;
                                }
                                try {
                                    transmuxer.push(new Uint8Array(lastSegmentDownloaded));
                                    transmuxer.flush();
                                }
                                catch (e) {
                                    throw new Error("error transmuxing segment ".concat(String(e)));
                                }
                            }
                        };
                        downloadSegmentAndFlush = function () {
                            var download;
                            // if we are waiting for segment to download we wait for it
                            if (alreadyDownloadingSegment) {
                                download = _this.preloader.waitForFetch(alreadyDownloadingSegment, _this.getSegmentTimeout(srcSetTime, maxSegmentDuration, durationDownloaded));
                                // subsequent segments can download as-is, we only use
                                // the downloading segment once from pre-loader
                                alreadyDownloadingSegment = undefined;
                            }
                            else {
                                download = _this.downloadSegment(srcSetTime, maxSegmentDuration, variant.segments[downloadSegmentIndex].url, durationDownloaded);
                            }
                            // run transmuxing in parallel with downloading segment, it will block thread
                            // while here the XMLHttpRequest from call to `downloadSegment` is sent.
                            flushSegmentToTransmuxer();
                            return download;
                        };
                        _a.label = 1;
                    case 1:
                        if (!(downloadSegmentIndex < variant.segments.length)) return [3 /*break*/, 7];
                        if (!(alreadyDownloadedSegments && alreadyDownloadedSegments.length)) return [3 /*break*/, 3];
                        // we have nothing to download but mux.js is a CPU intensive operation
                        // after flushing we will append the segment synchrously, this will block
                        // the thread. since we pre-loaded we have time to spare so we can let the
                        // CPU do other work here.
                        // eslint-disable-next-line no-await-in-loop
                        return [4 /*yield*/, new Promise(dom_1.safeRequestIdleCallback)];
                    case 2:
                        // we have nothing to download but mux.js is a CPU intensive operation
                        // after flushing we will append the segment synchrously, this will block
                        // the thread. since we pre-loaded we have time to spare so we can let the
                        // CPU do other work here.
                        // eslint-disable-next-line no-await-in-loop
                        _a.sent();
                        if (this.shouldStop(adSequence)) {
                            return [2 /*return*/];
                        }
                        flushSegmentToTransmuxer();
                        lastSegmentDownloaded = alreadyDownloadedSegments.shift();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, downloadSegmentAndFlush()];
                    case 4:
                        // eslint-disable-next-line no-await-in-loop
                        lastSegmentDownloaded = _a.sent();
                        if (this.shouldStop(adSequence)) {
                            return [2 /*return*/];
                        }
                        _a.label = 5;
                    case 5:
                        durationDownloaded += variant.segments[downloadSegmentIndex].duration;
                        _a.label = 6;
                    case 6:
                        downloadSegmentIndex++;
                        return [3 /*break*/, 1];
                    case 7:
                        flushSegmentToTransmuxer();
                        return [2 /*return*/];
                }
            });
        });
    };
    HlsAdPlayer.prototype.downloadAndAppendSegments = function (srcSetTime, adUrl, variant, buffer, mediaSource, transmuxer) {
        var _this = this;
        var adSequence = this.getAdSequence();
        var onBufferError;
        var onTransmuxerData;
        var onUpdateEnd;
        var onSourceEnded;
        var segmentsToAppend = [];
        var segmentsAppended = 0;
        var onSegmentToAppend = function (segment) {
            if (buffer.updating || segmentsToAppend.length) {
                segmentsToAppend.push(segment);
            }
            else {
                segmentsAppended++;
                buffer.appendBuffer(segment);
            }
        };
        // es5 target does not have a finally
        var andFinally = function () {
            segmentsToAppend = [];
            buffer.removeEventListener('error', onBufferError);
            buffer.removeEventListener('updateend', onUpdateEnd);
            mediaSource.removeEventListener('sourceended', onSourceEnded);
            if (transmuxer) {
                transmuxer.off('data', onTransmuxerData);
                transmuxer.reset();
            }
        };
        return Promise.all([
            new Promise(function (resolve, reject) {
                var expectedSegmentsAppended = variant.segments.length;
                if (!HlsAdPlayer.supportsMp2t) {
                    // will manually append 1 init segment
                    expectedSegmentsAppended++;
                }
                onBufferError = function () {
                    reject(new Error("error appending segment ".concat(segmentsAppended, " to source buffer")));
                };
                onSourceEnded = function () {
                    resolve();
                };
                onTransmuxerData = function (segment) {
                    if (_this.shouldStop(adSequence)) {
                        resolve();
                        return;
                    }
                    if (!segmentsAppended) {
                        onSegmentToAppend(segment.initSegment);
                    }
                    onSegmentToAppend(segment.data);
                };
                if (transmuxer) {
                    transmuxer.on('data', onTransmuxerData);
                }
                buffer.addEventListener('error', onBufferError);
                onUpdateEnd = function () {
                    if (_this.shouldStop(adSequence)) {
                        resolve();
                        return;
                    }
                    // appended the last segment of ad
                    if (segmentsAppended === expectedSegmentsAppended) {
                        if (mediaSource.readyState === 'open' && !buffer.updating) {
                            mediaSource.endOfStream();
                        }
                    }
                    else if (segmentsToAppend.length) {
                        segmentsAppended++;
                        buffer.appendBuffer(segmentsToAppend.shift());
                    }
                    if (mediaSource.readyState === 'ended') {
                        resolve();
                    }
                };
                buffer.addEventListener('updateend', onUpdateEnd);
                mediaSource.addEventListener('sourceended', onSourceEnded);
            }),
            this.downloadSegments(srcSetTime, adUrl, variant, transmuxer, onSegmentToAppend),
        ]).then(function (v) {
            andFinally();
            return v;
        }, function (e) {
            andFinally();
            return Promise.reject(e);
        });
    };
    return HlsAdPlayer;
}(progressiveMp4AdPlayer_1.default));
exports.default = HlsAdPlayer;
//# sourceMappingURL=index.js.map