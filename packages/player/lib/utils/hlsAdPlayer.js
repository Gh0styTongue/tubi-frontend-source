"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var progressiveMp4AdPlayer_1 = tslib_1.__importDefault(require("./progressiveMp4AdPlayer"));
/**
 * This is not a progressive mp4 ad player.
 * This class uses MPEG-TS To play ads.
 */
var HlsAdPlayer = /** @class */ (function (_super) {
    tslib_1.__extends(HlsAdPlayer, _super);
    function HlsAdPlayer(options) {
        var _this = _super.call(this, options) || this;
        _this.segmentsAppended = 0;
        _this.segmentsToAppend = [];
        return _this;
    }
    HlsAdPlayer.prototype.buildUrl = function (baseUrl, hlsUrl) {
        // absolute URL
        if (hlsUrl.startsWith('http://') || hlsUrl.startsWith('https://')) {
            return hlsUrl;
        }
        // absolute path to root
        if (hlsUrl.startsWith('/')) {
            return baseUrl.substring(0, baseUrl.indexOf('/', baseUrl.indexOf('://') + 3)) + hlsUrl;
        }
        return baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1) + hlsUrl;
    };
    HlsAdPlayer.prototype.getAttributes = function (attributes) {
        var attrName = '';
        var attrValue = '';
        var quoted = false;
        var attribute = false;
        var results = {};
        for (var _i = 0, attributes_1 = attributes; _i < attributes_1.length; _i++) {
            var character = attributes_1[_i];
            if (attribute) {
                if (attrValue === '' && character === '"') {
                    quoted = true;
                }
                else if ((quoted && character === '"') ||
                    (!quoted && character === ',')) {
                    quoted = false;
                    results[attrName] = attrValue;
                    attrName = '';
                    attribute = false;
                }
                else {
                    attrValue += character;
                }
            }
            else if (character === '=') {
                attribute = true;
                attrValue = '';
            }
            else {
                attrName += character;
            }
        }
        if (attrName) {
            results[attrName] = attrValue;
        }
        return results;
    };
    HlsAdPlayer.prototype.teardown = function () {
        if (this.activeRequest) {
            this.activeRequest.abort();
            this.activeRequest = undefined;
        }
        this.segmentsToAppend = [];
        this.clearObjectURL();
    };
    HlsAdPlayer.prototype.removeVideoElement = function () {
        this.teardown();
        _super.prototype.removeVideoElement.call(this);
    };
    /**
     * Selects which level to load.
     * If we have no bandwidth estimate we use the smallest 480p
     * If we have bandwidth estimate we use 720p if enough bandwidth
     */
    HlsAdPlayer.prototype.selectLevelToLoad = function (levels) {
        var lowest480p;
        var lowest720p;
        var bandwidthEstimate = this.options.bandwidthEstimate || -1;
        for (var _i = 0, levels_1 = levels; _i < levels_1.length; _i++) {
            var level = levels_1[_i];
            if (level.resolution.length !== 2) {
                continue;
            }
            var height = Number(level.resolution[1]);
            if (!lowest480p && height === 480) {
                lowest480p = level;
            }
            else if (height === 720) {
                lowest720p = level;
                break;
            }
        }
        if (bandwidthEstimate !== -1 && lowest720p && lowest720p.bandwidth < (bandwidthEstimate / 2)) {
            return lowest720p;
        }
        return lowest480p || levels[0];
    };
    HlsAdPlayer.prototype.getLevelFromManifest = function (adUrl, responseText) {
        var levels = [];
        try {
            var lines = responseText.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.startsWith('#EXT-X-STREAM-INF:')) {
                    var tags = this.getAttributes(line.substring(18));
                    levels.push({ variant: this.buildUrl(adUrl, lines[i + 1]), resolution: String(tags.RESOLUTION).split('x'), bandwidth: Number(tags.BANDWIDTH), codecs: tags.CODECS });
                }
            }
        }
        catch (e) {
            throw new Error("error parsing main manifest ".concat(adUrl, " ").concat(String(e)));
        }
        if (levels.length === 0) {
            throw new Error("empty manifest detected ".concat(adUrl));
        }
        return this.selectLevelToLoad(levels);
    };
    HlsAdPlayer.prototype.fetchMainManifest = function (adUrl) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var xhr = _this.activeRequest = new XMLHttpRequest();
            xhr.open('GET', adUrl);
            xhr.onabort = function () {
                _this.activeRequest = undefined;
                reject(new Error("main manifest request for ".concat(adUrl, " was aborted")));
            };
            xhr.onload = function () {
                _this.activeRequest = undefined;
                if (xhr.status < 200 || xhr.status >= 400) {
                    reject(new Error("status code ".concat(xhr.status, " for main manifest ").concat(adUrl)));
                    return;
                }
                try {
                    resolve(_this.getLevelFromManifest(adUrl, xhr.responseText));
                }
                catch (e) {
                    reject(e);
                }
            };
            xhr.onerror = function () {
                _this.activeRequest = undefined;
                reject(new Error("error event downloading main manifest ".concat(adUrl)));
            };
            xhr.send();
        });
    };
    HlsAdPlayer.prototype.getMetadataFromVariant = function (variantUrl, responseText) {
        var segments = [];
        try {
            var lines = responseText.split('\n');
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i];
                if (line.startsWith('#EXTINF:')) {
                    segments.push({
                        url: this.buildUrl(variantUrl, lines[i + 1]),
                        duration: Number(line.substring(8, line.indexOf(','))),
                    });
                }
            }
        }
        catch (e) {
            throw new Error("error parsing variant ".concat(variantUrl, " ").concat(String(e)));
        }
        if (segments.length === 0) {
            throw new Error("no segments found in manifest ".concat(variantUrl));
        }
        return {
            segments: segments,
        };
    };
    HlsAdPlayer.prototype.fetchVariant = function (variantUrl) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var xhr = _this.activeRequest = new XMLHttpRequest();
            xhr.open('GET', variantUrl);
            xhr.onabort = function () {
                _this.activeRequest = undefined;
                reject(new Error("variant request for ".concat(variantUrl, " was aborted")));
            };
            xhr.onload = function () {
                _this.activeRequest = undefined;
                if (xhr.status < 200 || xhr.status >= 400) {
                    reject(new Error("status code ".concat(xhr.status, " for variant manifest ").concat(variantUrl)));
                    return;
                }
                try {
                    resolve(_this.getMetadataFromVariant(variantUrl, xhr.responseText));
                }
                catch (e) {
                    reject(e);
                }
            };
            xhr.onerror = function () {
                _this.activeRequest = undefined;
                reject(new Error("error event downloading variant manifest ".concat(variantUrl)));
            };
            xhr.send();
        });
    };
    HlsAdPlayer.prototype.getVariant = function (adUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var level, variant;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.fetchMainManifest(adUrl)];
                    case 1:
                        level = _a.sent();
                        return [4 /*yield*/, this.fetchVariant(level.variant)];
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
    HlsAdPlayer.prototype.getMediaSource = function (videoElement) {
        var _this = this;
        var mediaSource = new MediaSource();
        return new Promise(function (resolve) {
            _this.objectURL = URL.createObjectURL(mediaSource);
            mediaSource.addEventListener('sourceopen', function () {
                _this.clearObjectURL();
                resolve(mediaSource);
            });
            videoElement.src = _this.objectURL;
        });
    };
    HlsAdPlayer.prototype.downloadSegments = function (variant, transmuxer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var downloadSegmentIndex = 0;
            var downloadSegment = function () {
                var segmentUrl = variant.segments[downloadSegmentIndex].url;
                var xhr = _this.activeRequest = new XMLHttpRequest();
                xhr.open('GET', segmentUrl);
                xhr.responseType = 'arraybuffer';
                xhr.onabort = function () {
                    _this.activeRequest = undefined;
                    reject(new Error("segment download ".concat(segmentUrl, " was aborted")));
                };
                xhr.onload = function () {
                    _this.activeRequest = undefined;
                    if (xhr.status < 200 || xhr.status >= 400) {
                        reject(new Error("failed to download segment ".concat(segmentUrl, " with status ").concat(xhr.status)));
                        return;
                    }
                    downloadSegmentIndex++;
                    if (downloadSegmentIndex < variant.segments.length) {
                        downloadSegment();
                    }
                    try {
                        transmuxer.push(new Uint8Array(xhr.response));
                        transmuxer.flush();
                    }
                    catch (e) {
                        reject(new Error("error transmuxing segment ".concat(segmentUrl, " ").concat(String(e))));
                        return;
                    }
                    if (downloadSegmentIndex >= variant.segments.length) {
                        resolve();
                    }
                };
                xhr.onerror = function () {
                    _this.activeRequest = undefined;
                    reject(new Error("error downloading segment ".concat(segmentUrl)));
                };
                xhr.send();
            };
            downloadSegment();
        });
    };
    HlsAdPlayer.prototype.onSourceBufferUpdateEnd = function (variant, buffer, mediaSource) {
        // appended the last segment of ad
        if (this.segmentsAppended === variant.segments.length) {
            if (mediaSource.readyState === 'open') {
                mediaSource.endOfStream();
            }
        }
        else if (this.segmentsToAppend.length) {
            this.segmentsAppended++;
            buffer.appendBuffer(this.segmentsToAppend.shift());
        }
    };
    HlsAdPlayer.prototype.onTransmuxerData = function (buffer, segment) {
        if (!this.segmentsAppended) {
            var data = new Uint8Array(segment.initSegment.byteLength + segment.data.byteLength);
            data.set(segment.initSegment, 0);
            data.set(segment.data, segment.initSegment.byteLength);
            this.segmentsAppended++;
            buffer.appendBuffer(data);
        }
        else if (buffer.updating || this.segmentsToAppend.length) {
            this.segmentsToAppend.push(new Uint8Array(segment.data));
        }
        else {
            this.segmentsAppended++;
            buffer.appendBuffer(new Uint8Array(segment.data));
        }
    };
    HlsAdPlayer.prototype.downloadAndAppendSegments = function (variant, buffer, mediaSource, transmuxer) {
        var _this = this;
        buffer.addEventListener('updateend', function () {
            _this.onSourceBufferUpdateEnd(variant, buffer, mediaSource);
        });
        transmuxer.on('data', function (segment) {
            _this.onTransmuxerData(buffer, segment);
        });
        return Promise.race([
            new Promise(function (_resolve, reject) {
                buffer.addEventListener('error', function () {
                    reject(new Error("error appending segment ".concat(_this.segmentsAppended, " to source buffer")));
                    _this.teardown();
                });
            }),
            this.downloadSegments(variant, transmuxer),
        ]);
    };
    HlsAdPlayer.prototype.getTotalDuration = function (variant) {
        var duration = 0;
        for (var _i = 0, _a = variant.segments; _i < _a.length; _i++) {
            var segment = _a[_i];
            duration += segment.duration;
        }
        return duration;
    };
    HlsAdPlayer.prototype.createMediaSourceAppendSegments = function (videoElement, adUrl) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, variant, mediaSource, transmuxer, codecs, buffer;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.options.muxJS) {
                            throw new Error('must provide muxJS');
                        }
                        this.segmentsAppended = 0;
                        return [4 /*yield*/, Promise.all([
                                this.getVariant(adUrl),
                                this.getMediaSource(videoElement),
                                this.options.muxJS().then(function (mp4Library) { return new mp4Library.Transmuxer({ remux: true, keepOriginalTimestamps: true }); }),
                            ])];
                    case 1:
                        _a = _b.sent(), variant = _a[0], mediaSource = _a[1], transmuxer = _a[2];
                        codecs = variant.level.codecs;
                        buffer = mediaSource.addSourceBuffer("video/mp4; codecs=\"".concat(codecs, "\""));
                        mediaSource.duration = this.getTotalDuration(variant.variant);
                        return [2 /*return*/, this.downloadAndAppendSegments(variant.variant, buffer, mediaSource, transmuxer)];
                }
            });
        });
    };
    HlsAdPlayer.prototype.setVideoElementSrcForAd = function (videoElement, adUrl) {
        var _this = this;
        this.createMediaSourceAppendSegments(videoElement, adUrl)
            .catch(function (err) {
            // when destroying we will abort open
            // XMLHttpRequests within HlsAdPlayer
            _this.getState() !== 'destroyed' && _this.onError(err);
        });
    };
    return HlsAdPlayer;
}(progressiveMp4AdPlayer_1.default));
exports.default = HlsAdPlayer;
//# sourceMappingURL=hlsAdPlayer.js.map