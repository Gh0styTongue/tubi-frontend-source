"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var constants_1 = require("./constants");
var interceptor_1 = require("./interceptor/interceptor");
var tools_1 = require("./utils/tools");
/**
 * Player class instantiates a new adapter, handle some common stuffs and expose a simple interface
 * Player class is responsible for emitting some events: 'setup', 'remove', 'firstFrame' and 'error.type === ErrorType.SETUP_ERROR`
 */
var Player = /** @class */ (function () {
    function Player(config) {
        var AdapterClass = config.Adapter, defaultCaptions = config.defaultCaptions, options = tslib_1.__rest(config, ["Adapter", "defaultCaptions"]);
        this.mediaUrl = config.mediaUrl;
        this.config = config;
        this.adapter = new AdapterClass(options);
        this.playerName = config.playerName;
        this.attachListeners();
    }
    Object.defineProperty(Player.prototype, "SDKName", {
        get: function () {
            return this.adapter.SDKName;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Player.prototype, "shouldReportBitrate", {
        get: function () {
            return this.config.shouldReportBitrate;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Player.prototype, "shouldWaitForSeekedEvent", {
        get: function () {
            var _a;
            return (_a = this.config.shouldWaitForSeekedEvent) !== null && _a !== void 0 ? _a : true;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Player.prototype, "actionsTimeout", {
        get: function () {
            return this.config.actionsTimeout;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Player.prototype, "isPlayingDRMContent", {
        get: function () {
            return !!this.config.licenseUrl;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Player.prototype, "SDKVersion", {
        get: function () {
            var _a, _b;
            return (_b = (_a = this.adapter).getSDKVersion) === null || _b === void 0 ? void 0 : _b.call(_a);
        },
        enumerable: false,
        configurable: true
    });
    Player.prototype.setMediaUrl = function (mediaUrl, position, config) {
        var _a, _b;
        if (position === void 0) { position = 0; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.mediaUrl = mediaUrl;
                        this.config = tslib_1.__assign(tslib_1.__assign({}, this.config), config);
                        this.adapter.emit(constants_1.PLAYER_EVENTS.reload);
                        return [4 /*yield*/, ((_b = (_a = this.adapter).setMediaUrl) === null || _b === void 0 ? void 0 : _b.call(_a, mediaUrl, position, config))];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Player.prototype.getMediaUrl = function () {
        return this.mediaUrl;
    };
    Player.prototype.setMediaSrc = function (url) {
        var _a, _b;
        this.attachFirstFrameEventListener();
        (_b = (_a = this.adapter).setMediaSrc) === null || _b === void 0 ? void 0 : _b.call(_a, url);
    };
    Player.prototype.getAdUrl = function () {
        return this.adapter.getAdUrl();
    };
    Player.prototype.getCurrentAd = function () {
        return this.adapter.getCurrentAd();
    };
    Player.prototype.getAdList = function () {
        return this.adapter.getAdList();
    };
    Player.prototype.getAdSequence = function () {
        return this.adapter.getAdSequence();
    };
    Player.prototype.getAdLagTime = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getAdLagTime) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.getVideoElement = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getVideoElement) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.getBufferedRange = function () {
        var _a, _b;
        return ((_b = (_a = this.adapter) === null || _a === void 0 ? void 0 : _a.getBufferedRange) === null || _b === void 0 ? void 0 : _b.call(_a)) || [];
    };
    Player.prototype.getBufferedLength = function () {
        var _a, _b;
        return (_b = (_a = this.adapter) === null || _a === void 0 ? void 0 : _a.getBufferedLength) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.getExternalVideoObject = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getExternalVideoObject) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.getVideoUrl = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getVideoUrl) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    /**
     * Load necessary resources like SDK and then setup the adapter
     */
    Player.prototype.setup = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.load()];
                    case 1:
                        _a.sent();
                        this.adapter.setup();
                        this.adapter.emit(constants_1.PLAYER_EVENTS.setup);
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.adapter.emit(constants_1.PLAYER_EVENTS.error, {
                            type: constants_1.ErrorType.SETUP_ERROR,
                            detail: error_1.detail,
                            fatal: true,
                            // preserve the underlying error.type in message
                            message: "".concat(error_1.type, " - ").concat(error_1.message),
                            errorSource: constants_1.ERROR_SOURCE.OTHER,
                        });
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // We aims to deprecate this one. Replace with setMediaUrl
    Player.prototype.reload = function (options) {
        var _a, _b;
        (_b = (_a = this.adapter).reload) === null || _b === void 0 ? void 0 : _b.call(_a, options);
    };
    // Boolean indicate if we get intercepted
    // We could extend this in the future
    Player.prototype.play = function (level) {
        if (level === void 0) { level = interceptor_1.ActionLevel.CODE; }
        if (!interceptor_1.interceptorManager.isMethodAllowed('play', level))
            return false;
        this.adapter.play();
        return true;
    };
    Player.prototype.pause = function () {
        this.adapter.pause();
    };
    Player.prototype.seek = function (position) {
        this.adapter.seek(position);
    };
    Player.prototype.playAdTag = function (tag, options) {
        this.adapter.playAdTag(tag, options);
    };
    Player.prototype.preloadAdResponse = function (response, cuePoint, isPreroll) {
        var _a, _b;
        (_b = (_a = this.adapter).preloadAdResponse) === null || _b === void 0 ? void 0 : _b.call(_a, response, cuePoint, isPreroll);
    };
    Player.prototype.playAdResponse = function (response) {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, ((_b = (_a = this.adapter).playAdResponse) === null || _b === void 0 ? void 0 : _b.call(_a, response))];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Player.prototype.remove = function () {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        (_b = (_a = this.adapter).beforeRemove) === null || _b === void 0 ? void 0 : _b.call(_a);
                        this.adapter.emit(constants_1.PLAYER_EVENTS.remove);
                        this.isDestroyed = true;
                        this.detachListeners();
                        return [4 /*yield*/, this.adapter.remove()];
                    case 1:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * get current state of player
     */
    Player.prototype.getState = function () {
        return this.adapter.getState();
    };
    Player.prototype.isPlaying = function () {
        return this.getState() === constants_1.State.playing;
    };
    Player.prototype.isPaused = function () {
        return this.getState() === constants_1.State.paused;
    };
    Player.prototype.isCompleted = function () {
        return this.getState() === constants_1.State.completed;
    };
    Player.prototype.isBuffering = function () {
        return this.adapter.getIsBuffering();
    };
    // FIXME find a better name
    Player.prototype.isAd = function () {
        return this.adapter.isAd();
    };
    Player.prototype.isPreroll = function () {
        return this.adapter.isPreroll();
    };
    /**
     * get current playback position, in seconds
     */
    Player.prototype.getPosition = function () {
        return this.adapter.getPosition();
    };
    /**
     * get current precise playback position, in seconds
     * We only use this for stall detection
     */
    Player.prototype.getPrecisePosition = function () {
        return this.adapter.getPrecisePosition();
    };
    /**
     * get ad current playback position, in seconds
     */
    Player.prototype.getAdPosition = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getAdPosition) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    /**
     * get duration of the content, in seconds
     */
    Player.prototype.getDuration = function () {
        return this.adapter.getDuration();
    };
    /**
     * get video source
     */
    Player.prototype.getResource = function () {
        return this.mediaUrl;
    };
    /**
     * get the current bitrate, in bits/s
     */
    Player.prototype.getBitrate = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getBitrate) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : -1;
    };
    Player.prototype.getIsAdFetching = function () {
        var _a, _b;
        return !!((_b = (_a = this.adapter).getIsAdFetching) === null || _b === void 0 ? void 0 : _b.call(_a));
    };
    /**
     * get the current bitrate, in bits/s
     */
    Player.prototype.getBandwidthEstimate = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getBandwidthEstimate) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : -1;
    };
    Player.prototype.getFragDownloadStats = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getFragDownloadStats) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    /**
     * get the current rendition
     */
    Player.prototype.getRendition = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getRendition) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : '';
    };
    Player.prototype.getQualityLevel = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getQualityLevel) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.getLevels = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getLevels) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
    };
    Player.prototype.getRestrictedLevels = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getRestrictedLevels) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
    };
    Player.prototype.getAutoLevelEnabled = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getAutoLevelEnabled) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : false;
    };
    Player.prototype.getCodecs = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getCodecs) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : '';
    };
    Player.prototype.getFrameRate = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getFrameRate) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : '';
    };
    Player.prototype.getAudioCodec = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getAudioCodec) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : '';
    };
    Player.prototype.getVideoCodec = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getVideoCodec) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : '';
    };
    /**
     * Is the adapter making use of a web worker to transmux segments?
     */
    Player.prototype.getIsUsingWebWorker = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getIsUsingWebWorker) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : false;
    };
    /**
     * get current captions index
     */
    Player.prototype.getCaptions = function () {
        return this.adapter.getCaptions();
    };
    /**
     * set current captions by index
     */
    Player.prototype.setCaptions = function (index) {
        this.adapter.setCaptions(index);
    };
    /**
     * set the caption styles
     */
    Player.prototype.setCaptionsStyles = function (captionsStyles) {
        var _a, _b;
        (_b = (_a = this.adapter).setCaptionsStyles) === null || _b === void 0 ? void 0 : _b.call(_a, captionsStyles);
    };
    /**
     * get all available captions
     * a new array of captions may be returned
     */
    Player.prototype.getCaptionsList = function () {
        return this.adapter.getCaptionsList();
    };
    Player.prototype.getCDN = function () {
        var _a, _b;
        return (0, tools_1.getCDNProvider)((_b = (_a = this.adapter).getCDN) === null || _b === void 0 ? void 0 : _b.call(_a));
    };
    Player.prototype.getCurrentAudioTrack = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getCurrentAudioTrack) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.getAudioTracks = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getAudioTracks) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
    };
    Player.prototype.setAudioTrack = function (info) {
        var _a, _b;
        return (_b = (_a = this.adapter).setAudioTrack) === null || _b === void 0 ? void 0 : _b.call(_a, info);
    };
    /**
     * get player mute status
     */
    Player.prototype.getMute = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getMute) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : false;
    };
    /**
     * mute/unmute player
     */
    Player.prototype.setMute = function (mute) {
        var _a, _b;
        (_b = (_a = this.adapter).setMute) === null || _b === void 0 ? void 0 : _b.call(_a, mute);
    };
    /**
     * get volume
     */
    Player.prototype.getVolume = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getVolume) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : -1;
    };
    /**
     * set the volume of the player between 1-100
     */
    Player.prototype.setVolume = function (volume) {
        var _a, _b;
        (_b = (_a = this.adapter).setVolume) === null || _b === void 0 ? void 0 : _b.call(_a, volume);
    };
    /**
     * set current quality
     */
    Player.prototype.setQuality = function (index) {
        if (this.adapter.setQuality) {
            this.adapter.setQuality(index);
        }
    };
    /**
     * set prerollUrl
     */
    Player.prototype.setPrerollUrl = function (url) {
        var _a;
        var thisAdapter = this.adapter;
        (_a = thisAdapter.setPrerollUrl) === null || _a === void 0 ? void 0 : _a.call(thisAdapter, url);
    };
    Player.prototype.getResourcesRealhost = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getResourcesRealhost) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.getBufferedVideoRange = function () {
        var _a, _b;
        return ((_b = (_a = this.adapter).getBufferedVideoRange) === null || _b === void 0 ? void 0 : _b.call(_a)) || [];
    };
    Player.prototype.getBufferedAudioRange = function () {
        var _a, _b;
        return ((_b = (_a = this.adapter).getBufferedAudioRange) === null || _b === void 0 ? void 0 : _b.call(_a)) || [];
    };
    /**
     * Is video buffered at the playhead?
     */
    Player.prototype.getIsCurrentTimeVideoBuffered = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getIsCurrentTimeVideoBuffered) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    /**
     * Is audio buffered at the playhead?
     */
    Player.prototype.getIsCurrentTimeAudioBuffered = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).getIsCurrentTimeAudioBuffered) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    /* Adapter proxy methods */
    Player.prototype.on = function (event, listener) {
        this.adapter.on(event, listener);
        return this;
    };
    /* Adapter proxy methods */
    Player.prototype.emit = function (event) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        (_a = this.adapter).emit.apply(_a, tslib_1.__spreadArray([event], args, false));
        return this;
    };
    Player.prototype.addListener = function (event, listener) {
        this.adapter.on(event, listener);
        return this;
    };
    Player.prototype.once = function (event, listener) {
        this.adapter.once(event, listener);
        return this;
    };
    Player.prototype.off = function (event, listener) {
        this.adapter.removeListener(event, listener);
        return this;
    };
    Player.prototype.removeListener = function (event, listener) {
        this.adapter.removeListener(event, listener);
        return this;
    };
    Player.prototype.removeAllListeners = function (event) {
        // The removeAllListener will only remove all listeners when the argument length is zero.
        if (!event) {
            this.adapter.removeAllListeners();
        }
        else {
            this.adapter.removeAllListeners(event);
        }
        return this;
    };
    Player.prototype.pauseDownloadingSegments = function () {
        var _a, _b;
        (_b = (_a = this.adapter).pauseDownloadingSegments) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.resumeDownloadingSegments = function () {
        var _a, _b;
        (_b = (_a = this.adapter).resumeDownloadingSegments) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.setMaxListeners = function (count) {
        this.adapter.setMaxListeners(count);
        return this;
    };
    Player.prototype.getTotalDroppedFrames = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getTotalDroppedFrames) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : -1;
    };
    Player.prototype.getFrameInfo = function () {
        if (this.adapter.getFrameInfo) {
            return this.adapter.getFrameInfo();
        }
        return [];
    };
    Player.prototype.getRenditionInfo = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter) === null || _a === void 0 ? void 0 : _a.getRenditionInfo) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : [];
    };
    Player.prototype.recoverHlsError = function (error) {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).recoverHlsError) === null || _b === void 0 ? void 0 : _b.call(_a, error)) !== null && _c !== void 0 ? _c : false;
    };
    Player.prototype.forceRecoverHlsError = function () {
        var _a, _b;
        return (_b = (_a = this.adapter).forceRecoverHlsError) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    Player.prototype.enterPictureInPicture = function () {
        if (!this.adapter.enterPictureInPicture) {
            return Promise.resolve();
        }
        return this.adapter.enterPictureInPicture();
    };
    Player.prototype.getSDKInfo = function () {
        var _a, _b;
        var name = this.adapter.SDKName;
        var version = (_b = (_a = this.adapter).getSDKVersion) === null || _b === void 0 ? void 0 : _b.call(_a);
        var isStable = !this.config.isSDKUpgrade;
        if (version) {
            return {
                name: name,
                version: version,
                isStable: isStable,
            };
        }
    };
    Player.prototype.getVideoPlaybackQuality = function () {
        var _a, _b, _c;
        return (_c = (_b = (_a = this.adapter).getVideoPlaybackQuality) === null || _b === void 0 ? void 0 : _b.call(_a)) !== null && _c !== void 0 ? _c : {};
    };
    Player.prototype.load = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var loadScript, error_2;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        loadScript = this.config.Adapter.loadScript;
                        if (typeof loadScript !== 'function')
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, loadScript(this.config)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.adapter.emit(constants_1.PLAYER_EVENTS.error, {
                            type: constants_1.ErrorType.NETWORK_ERROR,
                            details: constants_1.ErrorDetail.SCRIPT_LOAD_ERROR,
                            fatal: true,
                            message: error_2.message,
                            errorSource: constants_1.ERROR_SOURCE.OTHER,
                        });
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Player.prototype.attachListeners = function () {
        var _this = this;
        this.adapter.once(constants_1.PLAYER_EVENTS.allCaptionsAvailable, function (_a) {
            var captionsList = _a.captionsList;
            var _b = _this.config.defaultCaptions, defaultCaptions = _b === void 0 ? 'Off' : _b;
            var trackIndex = captionsList.findIndex(function (_a) {
                var _b = _a.lang, lang = _b === void 0 ? '' : _b;
                return lang.toLowerCase() === defaultCaptions.toLowerCase();
            });
            _this.setCaptions(Math.max(trackIndex, 0));
        });
        this.attachFirstFrameEventListener();
        this.attachContentStartEventListener();
    };
    Player.prototype.attachFirstFrameEventListener = function () {
        var _this = this;
        var _a;
        (_a = this.detachFirstFrameEventListener) === null || _a === void 0 ? void 0 : _a.call(this);
        var firstFrameEmitted = false;
        var emitFirstFrame = function () {
            var _a;
            if (firstFrameEmitted)
                return;
            firstFrameEmitted = true;
            _this.adapter.emit(constants_1.PLAYER_EVENTS.firstFrame);
            (_a = _this.detachFirstFrameEventListener) === null || _a === void 0 ? void 0 : _a.call(_this);
        };
        this.once(constants_1.PLAYER_EVENTS.time, emitFirstFrame);
        this.once(constants_1.PLAYER_EVENTS.adTime, emitFirstFrame);
        this.detachFirstFrameEventListener = function () {
            _this.removeListener(constants_1.PLAYER_EVENTS.time, emitFirstFrame);
            _this.removeListener(constants_1.PLAYER_EVENTS.adTime, emitFirstFrame);
            _this.detachFirstFrameEventListener = null;
        };
    };
    Player.prototype.attachContentStartEventListener = function () {
        var _this = this;
        var isPlayingContent = false;
        var timeEventCount = 0;
        var resumePosition = this.config.resumePosition || 0;
        var resumeFromAds = false;
        var isFromPreroll = false;
        this.adapter.on(constants_1.PLAYER_EVENTS.adStart, function () {
            isPlayingContent = false;
            timeEventCount = 0;
            resumePosition = _this.getPosition();
            resumeFromAds = true;
            isFromPreroll = _this.isPreroll();
        });
        this.adapter.on(constants_1.PLAYER_EVENTS.time, function (_a) {
            var position = _a.position;
            if (isPlayingContent || position <= resumePosition)
                return;
            timeEventCount++;
            if (timeEventCount >= 2) {
                _this.adapter.emit(constants_1.PLAYER_EVENTS.contentStart, {
                    resumeFromAds: resumeFromAds,
                    isFromPreroll: isFromPreroll,
                    position: position,
                });
                isPlayingContent = true;
            }
        });
    };
    Player.prototype.detachListeners = function () {
        this.removeAllListeners();
    };
    return Player;
}());
exports.default = Player;
//# sourceMappingURL=player.js.map