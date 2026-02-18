"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHlsErrorMessage = exports.DESTROY_TIMEOUT = void 0;
var tslib_1 = require("tslib");
var audioTrack_1 = require("./audioTrack");
var config_1 = require("./config");
var hlsForwardFlush_1 = require("./hlsForwardFlush");
var hlsLevelCappingManager_1 = tslib_1.__importDefault(require("./hlsLevelCappingManager"));
var hlsLevelInfoCollector_1 = tslib_1.__importDefault(require("./hlsLevelInfoCollector"));
var levels_1 = require("./levels");
var PlayerEventEmitter_1 = require("./PlayerEventEmitter");
var tools_1 = require("./tools");
var constants_1 = require("../constants");
var isAutoStartEnabled_1 = require("../interceptor/isAutoStartEnabled");
exports.DESTROY_TIMEOUT = 5000;
var MANIFEST_CDN_EXPIRED_CODE = 401;
var LINEAR_SESSION_EXPIRED_CODE = [400, 410];
var buildHlsErrorMessage = function (error, _a) {
    var ErrorTypes = _a.ErrorTypes, ErrorDetails = _a.ErrorDetails;
    var type = error.type, details = error.details, _b = error.networkDetails, networkDetails = _b === void 0 ? {} : _b;
    if (details === ErrorDetails.MANIFEST_LOAD_ERROR
        && networkDetails.status === MANIFEST_CDN_EXPIRED_CODE) {
        return constants_1.PLAYER_ERROR_DETAILS.MANIFEST_CDN_EXPIRED;
    }
    if (type === ErrorTypes.NETWORK_ERROR
        && details === ErrorDetails.LEVEL_LOAD_ERROR
        && LINEAR_SESSION_EXPIRED_CODE.includes(networkDetails.status)) {
        return constants_1.PLAYER_ERROR_DETAILS.LINEAR_SESSION_EXPIRED;
    }
    return details;
};
exports.buildHlsErrorMessage = buildHlsErrorMessage;
var HlsExtension = /** @class */ (function (_super) {
    tslib_1.__extends(HlsExtension, _super);
    /* istanbul ignore next */
    function HlsExtension(options, ExternalHls) {
        if (ExternalHls === void 0) { ExternalHls = window.Hls; }
        var _this = this;
        var _a, _b, _c;
        _this = _super.call(this) || this;
        _this.manifestLoadTimeoutRetryCount = 0;
        _this.recoverMediaErrorCount = 0;
        _this.recoverNetworkErrorCount = 0;
        _this.qualityLevelList = [];
        _this.lastHlsLevelIndex = -1;
        _this.isPreloaded = false;
        _this.fragDownloadStats = {
            video: {
                totalDownloadSize: 0,
                totalDownloadTimeConsuming: 0,
                totalDownloadFragDuration: 0,
            },
            audio: {
                totalDownloadSize: 0,
                totalDownloadTimeConsuming: 0,
                totalDownloadFragDuration: 0,
            },
        };
        _this.bufferDataEnough = {
            video: false,
            audio: false,
        };
        _this.url = options.url;
        _this.cdn = (0, tools_1.getUrlHost)(options.url);
        _this.videoElement = options.videoElement;
        _this.relyOnAutoplayAttribute = (_a = options.relyOnAutoplayAttribute) !== null && _a !== void 0 ? _a : false;
        _this._autoStart = (_b = options.autoStart) !== null && _b !== void 0 ? _b : false;
        _this.emeEnabled = !!((_c = options.hls) === null || _c === void 0 ? void 0 : _c.emeEnabled);
        _this.Hls = ExternalHls;
        _this.log = options.debug ? (0, tools_1.debug)('HlsExtension') : function () { };
        if (options.instance) {
            _this.hls = options.instance;
            _this.isPreloaded = true;
        }
        else {
            _this.hls = new ExternalHls(options.hls);
        }
        _this.hls.subtitleDisplay = false;
        if (options.maxLevelResolution) {
            _this.levelCappingManager = new hlsLevelCappingManager_1.default({
                hls: _this.hls,
                Hls: _this.Hls,
                maxLevelResolution: options.maxLevelResolution,
                playerEventEmitter: _this,
            });
        }
        _this.levelInfoCollector = new hlsLevelInfoCollector_1.default({ hls: _this.hls, Hls: _this.Hls });
        var _d = options.hls, _e = _d === void 0 ? {} : _d, frontBufferFlushThreshold = _e.frontBufferFlushThreshold;
        _this.forwardFlush = new hlsForwardFlush_1.HlsForwardFlush(_this.hls, _this.Hls, _this.videoElement);
        _this.forwardFlush.setup({
            frontBufferFlushThreshold: frontBufferFlushThreshold,
        });
        _this.setup();
        _this.attachHlsEvents();
        return _this;
    }
    Object.defineProperty(HlsExtension.prototype, "autoStart", {
        get: function () {
            return this._autoStart && (0, isAutoStartEnabled_1.isAutoStartEnabled)({ autoStart: this._autoStart });
        },
        enumerable: false,
        configurable: true
    });
    HlsExtension.prototype.getHlsInstance = function () {
        return this.hls;
    };
    /* istanbul ignore next */
    HlsExtension.prototype.getCDN = function () {
        return this.cdn;
    };
    HlsExtension.prototype.pauseDownloadingSegments = function () {
        /* istanbul ignore next */
        if (!this.hls || !this.hls.pauseDownloadingSegments)
            return;
        this.hls.pauseDownloadingSegments();
    };
    HlsExtension.prototype.resumeDownloadingSegments = function () {
        /* istanbul ignore next */
        if (!this.hls || !this.hls.resumeDownloadingSegments)
            return;
        this.hls.resumeDownloadingSegments();
    };
    /**
     * Is the extension using a web worker to transmux segments?
     */
    HlsExtension.prototype.getIsUsingWebWorker = function () {
        var _a, _b;
        return (_b = (_a = this.hls) === null || _a === void 0 ? void 0 : _a.isUsingWebWorker) !== null && _b !== void 0 ? _b : false;
    };
    HlsExtension.prototype.getCurrentLevel = function () {
        var hls = this.hls;
        if (!hls)
            return;
        var currentLevel = hls.currentLevel, levels = hls.levels;
        return levels === null || levels === void 0 ? void 0 : levels[currentLevel];
    };
    HlsExtension.prototype.getQualityLevel = function () {
        var hls = this.hls;
        if (!hls)
            return;
        var currentLevel = hls.currentLevel, levels = hls.levels;
        if (!levels || !levels[currentLevel])
            return;
        return (0, levels_1.convertHLSLevelToQualityLevelInfo)((levels[currentLevel]));
    };
    HlsExtension.prototype.getRestrictedLevels = function () {
        if (!this.levelCappingManager)
            return [];
        return this.levelCappingManager.restrictedLevels;
    };
    HlsExtension.prototype.getBitrate = function () {
        var level = this.getCurrentLevel();
        if (!level)
            return -1;
        var bitrate = level.bitrate, realBitrate = level.realBitrate;
        return realBitrate > 0
            ? realBitrate
            : bitrate;
    };
    /**
     * get the current rendition, e.g. '1280x720'
     */
    HlsExtension.prototype.getRendition = function () {
        var level = this.getCurrentLevel();
        if (level) {
            return (0, tools_1.getRenditionFromHlsLevelInfo)(level);
        }
        if (this.videoElement) {
            return (0, tools_1.buildRenditionString)({ width: this.videoElement.videoWidth, height: this.videoElement.videoHeight });
        }
        return '';
    };
    HlsExtension.prototype.getLevels = function () {
        return this.qualityLevelList;
    };
    HlsExtension.prototype.getAutoLevelEnabled = function () {
        var _a, _b;
        return (_b = (_a = this.hls) === null || _a === void 0 ? void 0 : _a.autoLevelEnabled) !== null && _b !== void 0 ? _b : false;
    };
    HlsExtension.prototype.getResourcesRealhost = function () {
        var _this = this;
        return new Promise(function (resolve) {
            var startTime = new Date().getTime();
            _this.fetchCdnInterval = setInterval(function () {
                var _a, _b;
                var url;
                /* istanbul ignore next */
                if (_this.hls) {
                    // @ts-expect-error: retrieve private then protected property
                    url = (_b = (_a = _this.hls.streamController) === null || _a === void 0 ? void 0 : _a.fragCurrent) === null || _b === void 0 ? void 0 : _b.url;
                }
                if (url) {
                    clearInterval(_this.fetchCdnInterval);
                    var hostname = (0, tools_1.getUrlHost)(url);
                    _this.cdn = hostname;
                    resolve(hostname);
                }
                else /* istanbul ignore next */ if (new Date().getTime() - startTime >= constants_1.MAX_WAITING_TIME_BEFORE_RETURN_CDN) {
                    clearInterval(_this.fetchCdnInterval);
                    resolve('');
                }
            }, 500);
        });
    };
    HlsExtension.prototype.getBandwidthEstimate = function () {
        var _a;
        if (!this.hls)
            return;
        // @ts-expect-error: get from the private property
        var bwEstimator = this.hls.abrController.bwEstimator;
        if (!bwEstimator) {
            return -1;
        }
        // use hls bandwidth estimate as bitrate
        // https://github.com/video-dev/hls.js/blob/master/docs/API.md#hlsbandwidthestimate
        // But as our version is too old, we need to use the internal API
        // https://github.com/video-dev/hls.js/commit/16685b3c04f928ec8417f0b239a387b1a50e61b4
        var estimate = (_a = bwEstimator.getEstimate()) !== null && _a !== void 0 ? _a : -1;
        return Number.isNaN(estimate) ? -1 : estimate;
    };
    HlsExtension.prototype.getFragDownloadStats = function () {
        return this.fragDownloadStats;
    };
    HlsExtension.prototype.getCurrentAudioTrack = function () {
        if (!this.hls)
            return;
        var _a = this.hls, audioTracks = _a.audioTracks, audioTrack = _a.audioTrack;
        var currentTrack = audioTracks[audioTrack];
        if (!currentTrack)
            return;
        return (0, audioTrack_1.convertHLSAudioTrackToAudioTrackInfo)(currentTrack, currentTrack.id);
    };
    HlsExtension.prototype.getAudioTracks = function () {
        if (!this.hls)
            return [];
        var _a = this.hls, audioTracks = _a.audioTracks, audioTrack = _a.audioTrack;
        var currentTrack = audioTracks[audioTrack];
        return audioTracks.map(function (track) { return (0, audioTrack_1.convertHLSAudioTrackToAudioTrackInfo)(track, currentTrack.id); });
    };
    HlsExtension.prototype.setAudioTrack = function (info) {
        if (!this.hls) {
            throw new Error('We can\'t set audio track without hls instance');
        }
        var audioTracks = this.hls.audioTracks;
        var index = audioTracks.findIndex(function (track) { return track.id === info.id; });
        if (index < 0)
            return false;
        this.hls.audioTrack = index;
        return true;
    };
    HlsExtension.prototype.setQuality = function (index) {
        var _this = this;
        var _a;
        if (!this.hls) {
            return;
        }
        this.emit(constants_1.PLAYER_EVENTS.qualityChange, { qualityIndex: index });
        if (((_a = this.qualityLevelList[index]) === null || _a === void 0 ? void 0 : _a.label) === constants_1.AUTOMATIC_QUALITY_LABEL) {
            // index=-1 means Auto in Hls.js
            this.hls.nextLevel = constants_1.HLS_JS_LEVEL.AUTO;
            return;
        }
        var hlsLevelIndex = this.hls.levels.findIndex(function (level) { return _this.qualityLevelList[index] && level.bitrate === _this.qualityLevelList[index].bitrate; });
        this.hls.nextLevel = hlsLevelIndex;
    };
    HlsExtension.prototype.isNoAudioTrack = function (hls) {
        return hls.audioTrack === undefined;
    };
    HlsExtension.prototype.destroy = function () {
        var _this = this;
        var _a;
        // There are async operations, so we add a flag to avoid executing them multiple times
        if (this.isDestroyed)
            return;
        this.isDestroyed = true;
        clearInterval(this.fetchCdnInterval);
        (_a = this.levelCappingManager) === null || _a === void 0 ? void 0 : _a.destroy();
        this.levelInfoCollector.destroy();
        this.forwardFlush.destroy();
        if (!this.emeEnabled) {
            /* istanbul ignore next */
            if (!this.hls)
                return;
            this.hls.destroy();
            delete this.hls;
            return;
        }
        return new Promise(function (resolve, reject) {
            var timer;
            var handleDestroyed = function () {
                clearTimeout(timer);
                delete _this.hls;
                resolve(undefined);
            };
            var Hls = _this.Hls;
            // destroy will remove all event listeners, so we must put it before adding listener
            if (_this.hls) {
                _this.hls.destroy();
                _this.hls.on(Hls.Events.EME_DESTROYED, handleDestroyed);
            }
            // If destroy operation timeout, clear hls instance and reject
            timer = setTimeout(function () {
                if (_this.hls) {
                    _this.hls.off(Hls.Events.EME_DESTROYED, handleDestroyed);
                }
                delete _this.hls;
                reject(new Error('HlsExtension destroy timeout.'));
            }, exports.DESTROY_TIMEOUT);
        });
    };
    HlsExtension.prototype.loadSource = function () {
        /*
        Consider waiting for the manifest to load before attempting playback
        if (!this.relyOnAutoplayAttribute) {
          this.hls.once(this.Hls.Events.MANIFEST_PARSED, () => {
            if (this.autoStart) {
              this.videoElement.play();
            }
          });
        } */
        this.log('load source');
        if (this.hls) {
            this.hls.loadSource(this.url);
        }
        if (this.relyOnAutoplayAttribute)
            return;
        // FIXME after figuring out the Xboxone TVT drop issue caused by removing the following line,
        // please consider how to better support `autostart=false` scenario
        if (this.autoStart) {
            this.videoElementPlay();
        }
    };
    HlsExtension.prototype.videoElementPlay = function () {
        var _this = this;
        Promise.resolve(this.videoElement.play())
            .catch(function (err) {
            _this.emit(constants_1.PLAYER_EVENTS.error, {
                type: _this.Hls.ErrorTypes.OTHER_ERROR,
                message: err.message,
                fatal: false,
                errorSource: constants_1.ERROR_SOURCE.HLS_EXTENSION_ERROR,
            });
        });
    };
    HlsExtension.prototype.setup = function () {
        var _this = this;
        this.log('setup');
        /* istanbul ignore next */
        if (!this.hls)
            return;
        this.hls.once(this.Hls.Events.MEDIA_ATTACHED, function () {
            _this.log('MEDIA_ATTACHED');
            if (_this.isPreloaded && _this.autoStart) {
                _this.videoElementPlay();
            }
            else {
                _this.loadSource();
            }
        });
        this.hls.attachMedia(this.videoElement);
    };
    HlsExtension.prototype.checkBufferDataEnough = function (type, isBufferEnough) {
        /* istanbul ignore next */
        if (!this.hls)
            return;
        this.bufferDataEnough[type] = isBufferEnough;
        if (isBufferEnough && this.bufferDataEnough.video && (this.isNoAudioTrack(this.hls) || this.bufferDataEnough.audio)) {
            this.emit(constants_1.PLAYER_EVENTS.bufferDataEnough);
        }
    };
    HlsExtension.prototype.attachHlsEvents = function () {
        var _this = this;
        var _a = this, Hls = _a.Hls, hls = _a.hls;
        /* istanbul ignore next */
        if (!hls)
            return;
        // Add error logs and try to recover some errors
        hls.on(Hls.Events.ERROR, function (event, data) {
            var _a;
            var type = data.type, details = data.details, fatal = data.fatal, reason = data.reason, err = data.err, frag = data.frag, response = data.response;
            var HlsErrorDetails = Hls.ErrorDetails;
            if (details === HlsErrorDetails.FRAG_LOAD_ERROR) {
                var fragmentRetryTimes = void 0;
                var levelLoadTimes = void 0;
                var levelIndex = (_a = data.frag) === null || _a === void 0 ? void 0 : _a.level;
                /* istanbul ignore else */
                if (levelIndex !== undefined && _this.hls) {
                    var currentLevel = _this.hls.levels[levelIndex];
                    fragmentRetryTimes = currentLevel === null || currentLevel === void 0 ? void 0 : currentLevel.fragmentError;
                    levelLoadTimes = currentLevel === null || currentLevel === void 0 ? void 0 : currentLevel.loadError;
                }
                _this.emit(constants_1.PLAYER_EVENTS.error, {
                    type: type,
                    message: (0, exports.buildHlsErrorMessage)(data, Hls),
                    fatal: fatal,
                    reason: reason,
                    fragUrl: frag === null || frag === void 0 ? void 0 : frag.url,
                    fragmentRetryTimes: fragmentRetryTimes,
                    levelLoadTimes: levelLoadTimes,
                    response: response,
                    err: err,
                    errorSource: constants_1.ERROR_SOURCE.HLS_EXTENSION_ERROR,
                    details: details,
                });
            }
            else {
                // These attributes are cyclic.
                var loader = data.loader, context = data.context, networkDetails = data.networkDetails, rest = tslib_1.__rest(data, ["loader", "context", "networkDetails"]);
                _this.emit(constants_1.PLAYER_EVENTS.error, tslib_1.__assign(tslib_1.__assign({}, rest), { message: (0, exports.buildHlsErrorMessage)(data, Hls), errorSource: constants_1.ERROR_SOURCE.HLS_EXTENSION_ERROR }));
            }
        });
        // Reset `manifestLoadTimeoutRetryCount` when manifest file is loaded
        hls.on(Hls.Events.MANIFEST_LOADED, function () {
            _this.manifestLoadTimeoutRetryCount = 0;
        });
        hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            if (!data || !data.levels) {
                return;
            }
            _this.qualityLevelList = tslib_1.__spreadArray([
                {
                    bitrate: 0,
                    width: 0,
                    height: 0,
                    label: constants_1.AUTOMATIC_QUALITY_LABEL,
                }
            ], data.levels
                .map(levels_1.convertHLSLevelToQualityLevelInfo)
                .sort(function (x, y) { return y.bitrate - x.bitrate; }), true);
            _this.emit(constants_1.PLAYER_EVENTS.qualityListChange, {
                qualityList: _this.qualityLevelList,
            });
        });
        hls.on(Hls.Events.FRAG_CHANGED, function (event, data) {
            var _a;
            var hlsLevelIndex = data.frag.level;
            if (_this.lastHlsLevelIndex === hlsLevelIndex)
                return;
            _this.lastHlsLevelIndex = hlsLevelIndex;
            /* istanbul ignore next */
            var hlsLevel = (_a = _this.hls) === null || _a === void 0 ? void 0 : _a.levels[hlsLevelIndex];
            var qualityIndex = _this.qualityLevelList.findIndex(function (level) { return level.bitrate === (hlsLevel === null || hlsLevel === void 0 ? void 0 : hlsLevel.bitrate); });
            _this.emit(constants_1.PLAYER_EVENTS.visualQualityChange, {
                qualityIndex: qualityIndex,
                level: _this.qualityLevelList[qualityIndex],
            });
        });
        hls.on(Hls.Events.FRAG_LOADING, function (event, data) {
            _this.cdn = (0, tools_1.getUrlHost)(data.frag.url);
            _this.checkBufferDataEnough(data.frag.type === 'audio' ? 'audio' : 'video', false);
        });
        // Ignore init segments download data because of no media duration, and init segments download will not trigger Events.FRAG_LOADED
        hls.on(Hls.Events.FRAG_LOADED, function (event, data) {
            if (data.frag.type === 'subtitle')
                return;
            var fragType = data.frag.type === 'audio' ? 'audio' : 'video';
            _this.fragDownloadStats[fragType].totalDownloadSize += data.frag.stats.total; // bits
            _this.fragDownloadStats[fragType].totalDownloadTimeConsuming += data.frag.stats.loading.end - data.frag.stats.loading.start; // milliseconds
            _this.fragDownloadStats[fragType].totalDownloadFragDuration += data.frag.duration; // seconds
        });
        hls.on(Hls.Events.DEVIATED_BUFFER_FLUSHING, function (event, flushArea) {
            _this.emit(constants_1.PLAYER_EVENTS.error, {
                type: Hls.ErrorTypes.OTHER_ERROR,
                message: Hls.Events.DEVIATED_BUFFER_FLUSHING,
                fatal: false,
                flushArea: flushArea,
                errorSource: constants_1.ERROR_SOURCE.HLS_EXTENSION_ERROR,
            });
        });
        hls.on(Hls.Events.BUFFER_DATA_ENOUGH, function (event, data) {
            _this.checkBufferDataEnough(data.type === 'audio' ? 'audio' : 'video', true);
        });
        hls.on(Hls.Events.BUFFER_EOS, function (event, data) {
            _this.checkBufferDataEnough(data.type === 'audio' ? 'audio' : 'video', true);
        });
        hls.on(Hls.Events.FPS_DROP, function (event, data) {
            _this.fpsDropData = data;
        });
        hls.on(Hls.Events.LEVELS_UPDATED, function (event, data) {
            _this.qualityLevelList = tslib_1.__spreadArray([
                {
                    bitrate: 0,
                    width: 0,
                    height: 0,
                    label: constants_1.AUTOMATIC_QUALITY_LABEL,
                }
            ], data.levels
                .map(levels_1.convertHLSLevelToQualityLevelInfo)
                .sort(function (x, y) { return y.bitrate - x.bitrate; }), true);
        });
        hls.on(Hls.Events.FPS_DROP_LEVEL_CAPPING, function (event, data) {
            var _a, _b, _c, _d;
            var level = data.level, droppedLevel = data.droppedLevel;
            var levels = hls.levels;
            var currentLevelAttrs = (_b = (_a = levels[level]) === null || _a === void 0 ? void 0 : _a.attrs) !== null && _b !== void 0 ? _b : {};
            var droppedLevelAttrs = (_d = (_c = levels[droppedLevel]) === null || _c === void 0 ? void 0 : _c.attrs) !== null && _d !== void 0 ? _d : {};
            _this.emit(constants_1.PLAYER_EVENTS.capLevelOnFPSDrop, {
                current: {
                    'RESOLUTION': currentLevelAttrs.RESOLUTION,
                    'CODECS': currentLevelAttrs.CODECS,
                    'FRAME-RATE': currentLevelAttrs['FRAME-RATE'],
                },
                previous: {
                    'RESOLUTION': droppedLevelAttrs.RESOLUTION,
                    'CODECS': droppedLevelAttrs.CODECS,
                    'FRAME-RATE': droppedLevelAttrs['FRAME-RATE'],
                },
            });
        });
        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, function () {
            // We need to wait for next tick in order for hls to update it's audioTracks array
            setTimeout(function () {
                var audioTracks = _this.getAudioTracks();
                if (audioTracks.length) {
                    _this.emit(constants_1.PLAYER_EVENTS.audioTracksAvailable, audioTracks);
                }
            }, 0);
        });
        hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, function () {
            var audioTracks = _this.getAudioTracks();
            if (audioTracks.length) {
                _this.emit(constants_1.PLAYER_EVENTS.audioTracksChange, audioTracks);
            }
        });
    };
    /* istanbul ignore next */
    HlsExtension.prototype.getTotalDroppedFrames = function () {
        var _a, _b;
        return (_b = (_a = this.fpsDropData) === null || _a === void 0 ? void 0 : _a.totalDroppedFrames) !== null && _b !== void 0 ? _b : -1;
    };
    /* istanbul ignore next */
    HlsExtension.prototype.getFPSDropData = function () {
        return this.fpsDropData;
    };
    HlsExtension.prototype.fetchAndResetFrameInfo = function () {
        return this.levelInfoCollector.fetchAndResetFrameInfo();
    };
    HlsExtension.prototype.fetchAndResetRenditionInfo = function () {
        return this.levelInfoCollector.fetchAndResetRenditionInfo();
    };
    HlsExtension.prototype.detachMedia = function () {
        /* istanbul ignore else */
        if (this.hls) {
            this.hls.detachMedia();
        }
    };
    HlsExtension.prototype.attachMedia = function () {
        var hls = this.hls;
        /* istanbul ignore else */
        if (hls) {
            // we need to remove the startPosition config when resume video
            (0, config_1.resetHlsStartPosition)(hls);
            hls.attachMedia(this.videoElement);
        }
    };
    HlsExtension.prototype.getAudioBuffered = function () {
        /* istanbul ignore next */
        if (!this.hls)
            return;
        return this.hls.audioBuffered;
    };
    HlsExtension.prototype.getVideoBuffered = function () {
        /* istanbul ignore next */
        if (!this.hls)
            return;
        return this.hls.videoBuffered;
    };
    HlsExtension.prototype.recoverHlsError = function (error) {
        var Hls = this.Hls;
        switch (error.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                return this.recoverHlsNetworkError(error);
            case Hls.ErrorTypes.MEDIA_ERROR:
                return this.recoverHlsMediaError();
            default:
                return false;
        }
    };
    HlsExtension.prototype.recoverHlsNetworkError = function (error) {
        var _a = this, Hls = _a.Hls, hls = _a.hls;
        if (!hls)
            return false;
        if (error.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
            if (this.manifestLoadTimeoutRetryCount < constants_1.MAX_HLS_MANIFEST_LOAD_TIMEOUT_RETRY_COUNT) {
                this.manifestLoadTimeoutRetryCount++;
                this.recoverMediaErrorWrapper(hls);
                this.emit(constants_1.PLAYER_EVENTS.reload);
                this.loadSource();
                return true;
            }
        }
        else if (this.recoverNetworkErrorCount < constants_1.MAX_RECOVER_HLS_NETWORK_ERROR_COUNT) {
            this.recoverNetworkErrorCount++;
            hls.startLoad();
            return true;
        }
        return false;
    };
    HlsExtension.prototype.recoverHlsMediaError = function () {
        if (!this.hls)
            return false;
        if (this.recoverMediaErrorCount < constants_1.MAX_RECOVER_HLS_MEDIA_ERROR_COUNT) {
            this.recoverMediaErrorCount++;
            this.recoverMediaErrorWrapper(this.hls);
            return true;
        }
        return false;
    };
    HlsExtension.prototype.recoverMediaErrorWrapper = function (hls) {
        hls.config.startPosition = this.videoElement.currentTime;
        this.emit(constants_1.PLAYER_EVENTS.reattachVideoElement);
        hls.recoverMediaError();
    };
    HlsExtension.prototype.forceRecoverHlsMediaError = function () {
        if (!this.hls)
            return;
        this.recoverMediaErrorWrapper(this.hls);
    };
    return HlsExtension;
}(PlayerEventEmitter_1.PlayerEventEmitter));
exports.default = HlsExtension;
//# sourceMappingURL=hlsExtension.js.map