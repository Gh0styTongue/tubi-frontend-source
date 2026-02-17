"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var localStorage_1 = require("@adrise/utils/lib/localStorage");
var ua_parser_1 = tslib_1.__importDefault(require("@adrise/utils/lib/ua-parser"));
var ua_sniffing_1 = require("@adrise/utils/lib/ua-sniffing");
var constants_1 = require("../constants");
var isAutoStartEnabled_1 = require("../interceptor/isAutoStartEnabled");
var types_1 = require("../types");
var adTools_1 = require("../utils/adTools");
var audioTrack_1 = require("../utils/audioTrack");
var captions_1 = require("../utils/captions");
var fairplay_1 = require("../utils/fairplay");
var fetchWrapper_1 = require("../utils/fetchWrapper");
var hlsExtension_1 = require("../utils/hlsExtension");
var levels_1 = require("../utils/levels");
var performanceCollector_1 = require("../utils/performanceCollector");
var PlayerEventEmitter_1 = require("../utils/PlayerEventEmitter");
var progressiveMp4AdPlayer_1 = tslib_1.__importDefault(require("../utils/progressiveMp4AdPlayer"));
var tools_1 = require("../utils/tools");
var MEDIA_ATTACH_TIMEOUT = 15000; // 15s
/**
 * WebAdapter is based on hls.js, it needs to manage the HTML5 video element in addition to hls.js API.
 * For the HTML5 video element, we heavily refer to the spec: https://html.spec.whatwg.org/multipage/media.html
 */
var WebAdapter = /** @class */ (function (_super) {
    tslib_1.__extends(WebAdapter, _super);
    function WebAdapter(config) {
        var _this = _super.call(this) || this;
        _this.isPlayingAd = false;
        _this.isContentBuffering = false;
        _this.isPlayingPreroll = false;
        _this.isPrerollStarted = false;
        _this.isReadyEmitted = false;
        _this.isUnsupported = false;
        _this.state = constants_1.State.idle;
        _this.contentDuration = 0;
        _this.qualityLevelList = [];
        _this._captionsList = [];
        _this.captionsIndex = 0;
        _this.captionsStylesString = '';
        _this.captionsUnits = [];
        _this.previousCaptionsText = '';
        _this.isAdFetching = false;
        _this.isVideoElementUsedByAdsInAdPlayer = false;
        _this.isPlaybackStarted = false;
        _this.mediaAttachTimer = 0;
        _this.shouldUseHls = false;
        _this.manifestLoadTimeoutRetryCount = 0;
        _this.recoverMediaErrorCount = 0;
        _this.recoverNetworkErrorCount = 0;
        _this.reuseVideoElement = false;
        _this.isPictureInPictureMode = false;
        _this.hasEmittedAudioTracksAvailable = false;
        _this.currentTimeProgressed = false;
        _this.isSeeking = false;
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
        _this.decodedFrames = 0;
        _this.droppedFrames = 0;
        _this.sdkName = 'unknown';
        /**
         * `loadedmetadata` is fired when the metadata has been loaded.
         */
        _this.onLoadedMetaData = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            _this.log('onLoadedMetaData', args);
            _this.notifyPlayerReady();
        };
        _this.onLoadedData = function () {
            if (!_this.videoElement)
                return;
            if (typeof _this.videoElement.audioTracks === 'undefined')
                return;
            if (!_this.hasEmittedAudioTracksAvailable && Array.from(_this.videoElement.audioTracks).length > 0) {
                _this.onAudioTracksAvailable();
            }
        };
        _this.onCanPlay = function () {
            _this.log('onCanPlay');
            _this.emit(constants_1.PLAYER_EVENTS.canPlay);
            _this.stopBuffering(constants_1.StopBufferingReason.el_canplay_event);
        };
        _this.onPlaying = function () {
            _this.log('onPlaying');
            /**
             * `playing` is fired from the video element after seeked,
             * but `play` isn't, so we reuse the same logic here
             * @link https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
             */
            if (_this.getState() !== constants_1.State.playing) {
                _this.onPlay();
            }
            _this.setState(constants_1.State.playing);
            _this.emit(_this.isAd() ? constants_1.PLAYER_EVENTS.adPlay : constants_1.PLAYER_EVENTS.play);
        };
        _this.onPlay = function () {
            _this.log('onPlay', _this.isAd());
            _this.videoElement.poster = '';
            _this.isPlaybackStarted = true;
            _this.stopBuffering(constants_1.StopBufferingReason.el_play_event);
        };
        _this.onPause = function () {
            _this.log('onPause', _this.isAd());
            _this.stopBuffering(constants_1.StopBufferingReason.el_pause_event);
            _this.setState(constants_1.State.paused);
            _this.emit(_this.isAd() ? constants_1.PLAYER_EVENTS.adPause : constants_1.PLAYER_EVENTS.pause);
        };
        _this.onSeeking = function () {
            _this.isSeeking = true;
        };
        _this.onSeeked = function () {
            _this.isSeeking = false;
            _this.contentPosition = _this.videoElement.currentTime;
            _this.log('onSeeked', _this.contentPosition);
            _this.emit(constants_1.PLAYER_EVENTS.seeked, {
                offset: _this.getPosition(),
            });
        };
        _this.onTimeupdate = function () {
            var position = _this.videoElement.currentTime;
            _this.stopBuffering(constants_1.StopBufferingReason.el_timeupdate_event_1);
            if (_this.isAd())
                return;
            if (!_this.isSeeking && !_this.currentTimeProgressed && Math.abs(position - _this.resumePosition) > constants_1.CURRENT_TIME_PROGRESSED_THRESHOLD) {
                _this.currentTimeProgressed = true;
                _this.emit(constants_1.PLAYER_EVENTS.currentTimeProgressed);
            }
            _this.contentPosition = position;
            _this.emit(constants_1.PLAYER_EVENTS.time, {
                position: _this.getPosition(),
                duration: _this.getDuration(),
            });
            _this.updateCaptions();
        };
        _this.onWaiting = function () {
            _this.log('onWaiting');
            _this.startBuffering(constants_1.StartBufferingReason.el_waiting_event);
            // For HLSv3, due to our packaging tool, the start PTS is usually 0.08342s, so there is no buffer at 0s.
            // It causes `waiting` event only in Safari. We need seek to the earliest buffered position here.
            if (_this.videoElement.currentTime === 0 && _this.videoElement.buffered.length) {
                var bufferStartPosition = _this.videoElement.buffered.start(0);
                if (bufferStartPosition > 0 && bufferStartPosition < 1) {
                    // seek to a safe buffered position, for example: 0.08342 => 0.1
                    _this.seek(Math.ceil(bufferStartPosition * 10) / 10, 'automatedAction');
                }
            }
        };
        _this.onEnded = function () {
            _this.log('onEnded');
            _this.stopBuffering(constants_1.StopBufferingReason.el_ended_event);
            _this.setState(constants_1.State.completed);
            _this.emit(constants_1.PLAYER_EVENTS.complete);
        };
        _this.onVideoElementError = function (error) {
            /**
             * The event listener will throw an event on the video element.
             * That's useless for us.
             * We should get the error attribute instead.
             */
            var err = error && !(error instanceof Event)
                ? error
                : _this.videoElement.error;
            _this.log('onError', err);
            var code = err === null || err === void 0 ? void 0 : err.code;
            _this.emit(constants_1.PLAYER_EVENTS.error, {
                type: constants_1.ErrorType.MEDIA_ERROR,
                code: code,
                message: err === null || err === void 0 ? void 0 : err.message,
                fatal: (0, tools_1.isFatalNativeError)(code),
                error: err,
                errorSource: constants_1.ERROR_SOURCE.NATIVE_ERROR,
            });
        };
        _this.onDurationChange = function () {
            var duration = _this.videoElement.duration;
            _this.contentDuration = duration;
            _this.log('onDurationChange', duration);
        };
        /**
         * Checks against the defaultAudioTrack set in the config and sets it if it exists
         * in our audio track list. Otherwise it will ensures that the initial audio track
         * is always set to the main audio track as Safari does not guarantee the order of the audio tracks
         */
        _this.setDefaultAudioTrack = function () {
            var defaultAudioTrack = _this.config.defaultAudioTrack;
            if (defaultAudioTrack) {
                var currentAudioTrack_1 = _this.getCurrentAudioTrack();
                if (!currentAudioTrack_1 || currentAudioTrack_1.role !== defaultAudioTrack.role || currentAudioTrack_1.language !== defaultAudioTrack.language) {
                    var audioTracks = _this.getAudioTracks();
                    var audioTrackToSet = audioTracks.find(function (audioTrack) {
                        return audioTrack.role === defaultAudioTrack.role && audioTrack.language === defaultAudioTrack.language;
                    });
                    if (audioTrackToSet) {
                        _this.setAudioTrack(audioTrackToSet);
                        return;
                    }
                }
            }
            var currentAudioTrack = _this.getCurrentAudioTrack();
            if ((currentAudioTrack === null || currentAudioTrack === void 0 ? void 0 : currentAudioTrack.role) === 'description') {
                var audioTracks = _this.getAudioTracks();
                var mainAudioTrack = audioTracks.find(function (audioTrack) { return audioTrack.role === 'main'; });
                if (mainAudioTrack) {
                    _this.setAudioTrack(mainAudioTrack);
                }
            }
        };
        _this.onAudioTracksAvailable = function () {
            if (_this.hasEmittedAudioTracksAvailable)
                return;
            // We need to wait for next tick in order for hls to update it's audioTracks array
            setTimeout(function () {
                _this.setDefaultAudioTrack();
                _this.emit(constants_1.PLAYER_EVENTS.audioTracksAvailable, _this.getAudioTracks());
                _this.hasEmittedAudioTracksAvailable = true;
            }, 0);
        };
        _this.mediaUrl = config.mediaUrl;
        _this.cdn = (0, tools_1.getUrlHost)(config.mediaUrl);
        _this.config = config;
        _this.playerContainerElement = config.playerContainer;
        _this.resumePosition = _this.contentPosition = config.resumePosition || 0;
        _this.log = (0, tools_1.isPlayerDebugEnabled)(config.debugLevel) ? (0, tools_1.debug)('WebAdapter') : function () { };
        _this.videoElement = _this.playerContainerElement.querySelector("[data-id=\"".concat(WebAdapter.VIDEO_COMPONENT_ID, "\"]"));
        _this.captionsElement = _this.playerContainerElement.querySelector("[data-id=\"".concat(WebAdapter.CAPTIONS_COMPONENT_ID, "\"]"));
        _this.adContainerElement = _this.playerContainerElement.querySelector("[data-id=\"".concat(WebAdapter.AD_COMPONENT_ID, "\"]"));
        _this.reuseVideoElement = _this.config.reuseVideoElement;
        _this.init();
        return _this;
    }
    Object.defineProperty(WebAdapter.prototype, "SDKName", {
        get: function () {
            return this.sdkName;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WebAdapter.prototype, "Hls", {
        get: function () {
            return WebAdapter.Hls;
        },
        enumerable: false,
        configurable: true
    });
    WebAdapter.prototype.setupVideoElementPlayback = function () {
        this.log('setupVideoElementPlayback');
        // ensures that on iOS devices we do not automatically
        // go to native fullscreen mode when playback starts
        this.videoElement.setAttribute('playsinline', '');
        this.detachVideoElementEvents = this.attachVideoElementEvents();
        this.attachPlayerEvents();
        this.loadSource();
    };
    WebAdapter.prototype.setupExtensionPlayback = function () {
        var _this = this;
        var _a;
        this.log('setupExtensionPlayback');
        var _b = this.config, extensionConfig = _b.extensionConfig, licenseUrl = _b.licenseUrl, drmKeySystem = _b.drmKeySystem;
        var hlsConfig = tslib_1.__assign({ debug: this.config.debugLevel === constants_1.PLAYER_LOG_LEVEL.SDK_LEVEL, maxBufferSize: 30 * 1000 * 1000, maxMaxBufferLength: 180 }, ((0, types_1.isHlsExtensionConfig)(extensionConfig) ? extensionConfig.hls : {}));
        if (licenseUrl) {
            switch (drmKeySystem) {
                case constants_1.DrmKeySystem.PlayReady:
                    hlsConfig = tslib_1.__assign(tslib_1.__assign({}, hlsConfig), { playreadyLicenseUrl: licenseUrl });
                    break;
                case constants_1.DrmKeySystem.Widevine:
                    hlsConfig = tslib_1.__assign(tslib_1.__assign({}, hlsConfig), { widevineLicenseUrl: licenseUrl });
                    break;
                default:
                    break;
            }
            hlsConfig = tslib_1.__assign(tslib_1.__assign({}, hlsConfig), { emeEnabled: true });
        }
        this.hls = new WebAdapter.Hls(hlsConfig);
        (_a = this.performanceCollector) === null || _a === void 0 ? void 0 : _a.setHls(this.hls);
        this.detachVideoElementEvents = this.attachVideoElementEvents();
        this.attachPlayerEvents();
        this.hls.attachMedia(this.videoElement);
        this.mediaAttachTimer = window.setTimeout(function () {
            /* istanbul ignore next */
            _this.onVideoElementError(new Error('Media attach timeout.'));
        }, MEDIA_ATTACH_TIMEOUT);
    };
    /**
     * Setup player, including unsupported handling, initialization, attaching events,
     * and other necessary tasks.
     *
     * May set up HlsJS, but may also rely on native video element hls playback
     *
     * In the HlsJS case, it needs the Hlsjs SDK to be ready
     */
    WebAdapter.prototype.setup = function (isResume, isResumeFromPreroll) {
        if (isResume === void 0) { isResume = false; }
        if (isResumeFromPreroll === void 0) { isResumeFromPreroll = false; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, drmKeySystem, performanceCollectorEnabled;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.state === constants_1.State.destroyed) {
                            this.log('ignoring setup since destroyed');
                            return [2 /*return*/];
                        }
                        _a = this.config, drmKeySystem = _a.drmKeySystem, performanceCollectorEnabled = _a.performanceCollectorEnabled;
                        if (performanceCollectorEnabled) {
                            this.performanceCollector = new performanceCollector_1.PerformanceCollector({
                                ExternalHls: WebAdapter.Hls,
                                reporter: function (metrics) { return _this.emit(constants_1.PLAYER_EVENTS.startupPerformance, {
                                    isAd: false,
                                    metrics: metrics,
                                    isAfterAd: isResume,
                                    isFromPreroll: isResumeFromPreroll,
                                }); },
                                debug: (0, tools_1.isPlayerDebugEnabled)(this.config.debugLevel),
                            });
                            this.performanceCollector.setVideoElement(this.videoElement);
                        }
                        if (!isResume) {
                            this.emit(constants_1.PLAYER_EVENTS.startLoad, {
                                isResumeFromAd: false,
                                isResumeFromPreroll: isResumeFromPreroll,
                            });
                        }
                        this.currentTimeProgressed = false;
                        // Need to use video element to handle FairPlay 1.0 DRM playback
                        this.log('setup', this.getPosition());
                        if (!this.isSupported()) {
                            this.isUnsupported = true;
                            this.handleUnsupported();
                            return [2 /*return*/];
                        }
                        if (!(drmKeySystem === constants_1.DrmKeySystem.FairPlay)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.setupFairPlay()];
                    case 1:
                        _b.sent();
                        this.shouldUseHls = false;
                        this.sdkName = 'video-tag';
                        return [3 /*break*/, 3];
                    case 2:
                        if ((0, ua_sniffing_1.isWebkitIPhone)((0, ua_parser_1.default)())) {
                            this.shouldUseHls = false;
                            this.sdkName = 'video-tag';
                        }
                        else {
                            this.shouldUseHls = true;
                            this.sdkName = 'hls.js';
                        }
                        _b.label = 3;
                    case 3:
                        if (this.shouldUseHls) {
                            this.setupExtensionPlayback();
                        }
                        else {
                            this.setupVideoElementPlayback();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    WebAdapter.prototype.loadSource = function () {
        var _a;
        (_a = this.hls) === null || _a === void 0 ? void 0 : _a.loadSource(this.mediaUrl);
        // Support video element playback
        if (!this.shouldUseHls) {
            this.videoElement.src = this.mediaUrl;
        }
    };
    WebAdapter.prototype.play = function () {
        var _this = this;
        var _a;
        var prerollUrl = this.config.prerollUrl;
        this.log('play', this.isAd());
        if (this.isUnsupported)
            return;
        if (prerollUrl && !this.isPrerollStarted) {
            this.isPrerollStarted = true;
            this.isPlayingPreroll = true;
            // simulate a valid response for play action before entering ad playback
            this.onPlay();
            this.playAdTag(prerollUrl);
            return;
        }
        if (this.isAd()) {
            /* istanbul ignore next */
            (_a = this.adClient) === null || _a === void 0 ? void 0 : _a.play();
        }
        else {
            // FIXME all target browser env support promise `play` method?
            Promise.resolve()
                .then(function () { return _this.videoElement.play(); })
                .catch(this.onVideoElementError);
        }
    };
    WebAdapter.prototype.isPreroll = function () {
        return this.isPlayingPreroll;
    };
    WebAdapter.prototype.hideVideoElementIfNotReuseVideoElement = function () {
        if (!this.shouldReuseVideoElement()) {
            this.videoElement.style.visibility = 'hidden';
        }
    };
    WebAdapter.prototype.shouldReuseVideoElement = function () {
        return this.reuseVideoElement;
    };
    WebAdapter.prototype.pauseDownloadingSegments = function () {
        var _a, _b;
        (_b = (_a = this.hls) === null || _a === void 0 ? void 0 : _a.pauseDownloadingSegments) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    WebAdapter.prototype.resumeDownloadingSegments = function () {
        var _a, _b;
        (_b = (_a = this.hls) === null || _a === void 0 ? void 0 : _a.resumeDownloadingSegments) === null || _b === void 0 ? void 0 : _b.call(_a);
    };
    WebAdapter.prototype.pause = function () {
        var _a;
        this.log('pause');
        if (this.isUnsupported)
            return;
        if (this.isAd()) {
            /* istanbul ignore else */
            (_a = this.adClient) === null || _a === void 0 ? void 0 : _a.pause();
        }
        else {
            this.videoElement.pause();
        }
    };
    /**
     * start to jump to a specified position, in seconds
     */
    WebAdapter.prototype.seek = function (position, seekActionType) {
        if (seekActionType === void 0) { seekActionType = 'userAction'; }
        this.log('seek', position);
        if (this.isUnsupported || this.isAd() || this.isAdFetching)
            return;
        this.emit(constants_1.PLAYER_EVENTS.seek, {
            position: this.getPosition(),
            offset: position,
            seekActionType: seekActionType,
        });
        this.videoElement.currentTime = position;
    };
    WebAdapter.prototype.getAdUrl = function () {
        var _a;
        return (_a = this.adClient) === null || _a === void 0 ? void 0 : _a.getAdUrl();
    };
    WebAdapter.prototype.getCurrentAd = function () {
        var _a;
        return (_a = this.adClient) === null || _a === void 0 ? void 0 : _a.getCurrentAd();
    };
    WebAdapter.prototype.getAdList = function () {
        var _a;
        return (_a = this.adClient) === null || _a === void 0 ? void 0 : _a.getAdList();
    };
    WebAdapter.prototype.getAdSequence = function () {
        var _a;
        return (_a = this.adClient) === null || _a === void 0 ? void 0 : _a.getAdSequence();
    };
    WebAdapter.prototype.getAdLagTime = function () {
        var _a;
        return ((_a = this.adClient) === null || _a === void 0 ? void 0 : _a.getLagTime()) || -1;
    };
    WebAdapter.prototype.getState = function () {
        return this.state;
    };
    WebAdapter.prototype.getVideoElement = function () {
        return this.videoElement;
    };
    WebAdapter.prototype.getIsBuffering = function () {
        return this.adClient
            ? this.adClient.getIsBuffering()
            : this.isContentBuffering;
    };
    /**
     * The buffered range of the video stream as understood by
     * the player
     */
    WebAdapter.prototype.getBufferedVideoRange = function () {
        var _a;
        if (this.adClient) {
            /* istanbul ignore next */
            return ((_a = this.adClient) === null || _a === void 0 ? void 0 : _a.getBufferedRange()) || [];
        }
        /* istanbul ignore next */
        if (!this.hls)
            return [];
        return (0, tools_1.transBufferedRangesIntoArray)(this.hls.videoBuffered);
    };
    /**
       * The buffered range of the audio stream as understood by
       * the player
       */
    WebAdapter.prototype.getBufferedAudioRange = function () {
        var _a;
        if (this.adClient) {
            /* istanbul ignore next */
            return ((_a = this.adClient) === null || _a === void 0 ? void 0 : _a.getBufferedRange()) || [];
        }
        /* istanbul ignore next */
        if (!this.hls)
            return [];
        return (0, tools_1.transBufferedRangesIntoArray)(this.hls.audioBuffered);
    };
    WebAdapter.prototype.getBufferedRange = function () {
        var buffered = this.videoElement.buffered;
        return (0, tools_1.transBufferedRangesIntoArray)(buffered);
    };
    WebAdapter.prototype.getBufferedLength = function () {
        var position = this.getPrecisePosition();
        var range = this.getBufferedRange().find(function (_a) {
            var start = _a[0], end = _a[1];
            return start <= position && position <= end;
        });
        if (range) {
            return range[1] - position;
        }
    };
    /**
     * Is video buffered at the playhead?
     */
    WebAdapter.prototype.getIsCurrentTimeVideoBuffered = function () {
        var position = this.adClient ? this.adClient.getAdPosition() : this.getPrecisePosition();
        var isEnded = this.adClient ? this.adClient.isAdEnded() : this.videoElement.ended;
        if (isEnded)
            return true;
        return (0, tools_1.isTimeInBufferedRange)(position, this.getBufferedVideoRange());
    };
    /**
     * Is audio buffered at the playhead?
     */
    WebAdapter.prototype.getIsCurrentTimeAudioBuffered = function () {
        var position = this.adClient ? this.adClient.getAdPosition() : this.getPrecisePosition();
        var isEnded = this.adClient ? this.adClient.isAdEnded() : this.videoElement.ended;
        if (isEnded)
            return true;
        return (0, tools_1.isTimeInBufferedRange)(position, this.getBufferedAudioRange());
    };
    /**
     * get the current playback position, in seconds
     */
    WebAdapter.prototype.getPosition = function () {
        return this.contentPosition;
    };
    WebAdapter.prototype.getPrecisePosition = function () {
        return this.videoElement.currentTime;
    };
    /**
     * get ad current playback position, in seconds
     */
    WebAdapter.prototype.getAdPosition = function () {
        var _a;
        return (_a = this.adClient) === null || _a === void 0 ? void 0 : _a.getAdPosition();
    };
    /**
     * get duration of the content, in seconds
     */
    WebAdapter.prototype.getDuration = function () {
        return this.contentDuration;
    };
    WebAdapter.prototype.getCurrentLevel = function () {
        var player = this.hls;
        if (!player) {
            return;
        }
        var currentLevel = player.currentLevel, levels = player.levels;
        return levels === null || levels === void 0 ? void 0 : levels[currentLevel];
    };
    WebAdapter.prototype.getQualityLevel = function () {
        var hls = this.hls;
        if (!hls)
            return;
        var currentLevel = hls.currentLevel, levels = hls.levels;
        if (!levels || !levels[currentLevel])
            return;
        return (0, levels_1.convertHLSLevelToQualityLevelInfo)((levels[currentLevel]));
    };
    WebAdapter.prototype.getCodecs = function () {
        var _a, _b;
        /* istanbul ignore next */
        return (_b = (_a = this.getCurrentLevel()) === null || _a === void 0 ? void 0 : _a.codecSet) !== null && _b !== void 0 ? _b : '';
    };
    WebAdapter.prototype.getVideoCodec = function () {
        var _a, _b;
        return (_b = (_a = this.getCurrentLevel()) === null || _a === void 0 ? void 0 : _a.videoCodec) !== null && _b !== void 0 ? _b : '';
    };
    WebAdapter.prototype.getAudioCodec = function () {
        var _a, _b;
        return (_b = (_a = this.getCurrentLevel()) === null || _a === void 0 ? void 0 : _a.audioCodec) !== null && _b !== void 0 ? _b : '';
    };
    /**
     * get the current bitrate, e.g. 246440
     */
    WebAdapter.prototype.getBitrate = function () {
        var _a, _b;
        return (_b = (_a = this.getCurrentLevel()) === null || _a === void 0 ? void 0 : _a.bitrate) !== null && _b !== void 0 ? _b : -1;
    };
    /**
     * Get the CDN name of the current playback
     */
    WebAdapter.prototype.getCDN = function () {
        return this.cdn;
    };
    /**
     * get the current bandwidth estimate, e.g. 70921269.07987899
     */
    WebAdapter.prototype.getBandwidthEstimate = function () {
        if (!this.hls) {
            return -1;
        }
        if (typeof this.hls.bandwidthEstimate !== 'undefined') {
            return this.hls.bandwidthEstimate;
        }
        var player = this.hls;
        var bwEstimator = player.abrController._bwEstimator;
        if (!bwEstimator) {
            return -1;
        }
        // use hls bandwidth estimate as bitrate
        // https://github.com/video-dev/hls.js/blob/master/docs/API.md#hlsbandwidthestimate
        // But as our version is too old, we need to use the internal API
        // https://github.com/video-dev/hls.js/commit/16685b3c04f928ec8417f0b239a387b1a50e61b4
        var estimate = bwEstimator.getEstimate();
        return Number.isNaN(estimate) ? -1 : estimate;
    };
    /**
     * get the current rendition, e.g. '1280x720'
     */
    WebAdapter.prototype.getRendition = function () {
        var level = this.getCurrentLevel();
        if (level) {
            if (level.name) {
                return level.name;
            }
            /* istanbul ignore else */
            if (level.bitrate) {
                return (0, tools_1.buildRenditionString)({ width: level.width, height: level.height, bitrate: level.bitrate });
            }
        }
        else if (this.videoElement) {
            return (0, tools_1.buildRenditionString)({ width: this.videoElement.videoWidth, height: this.videoElement.videoHeight });
        }
        return '';
    };
    WebAdapter.prototype.getFragDownloadStats = function () {
        return this.fragDownloadStats;
    };
    WebAdapter.prototype.remove = function () {
        var _a, _b, _c;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var exception_1;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.log('remove');
                        if (this.state === constants_1.State.destroyed) {
                            return [2 /*return*/];
                        }
                        this.setState(constants_1.State.destroyed);
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.destroyHls()];
                    case 2:
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        exception_1 = _d.sent();
                        /* istanbul ignore next */
                        this.log(exception_1, 'Error while destroying extension before cue point.');
                        return [3 /*break*/, 4];
                    case 4:
                        (_a = this.detachVideoElementEvents) === null || _a === void 0 ? void 0 : _a.call(this);
                        (_b = this.detachFairPlayEvents) === null || _b === void 0 ? void 0 : _b.call(this);
                        if (this.adClient) {
                            this.adClient.remove();
                        }
                        (_c = this.performanceCollector) === null || _c === void 0 ? void 0 : _c.destroy();
                        window.clearTimeout(this.mediaAttachTimer);
                        return [2 /*return*/];
                }
            });
        });
    };
    WebAdapter.prototype.trackAdMissed = function (_a) {
        var _b, _c;
        var ads = _a.ads, metrics = _a.metrics;
        if (!ads || ads.length === 0)
            return;
        /* istanbul ignore next: ignore optional chaining */
        (_c = (_b = this.config) === null || _b === void 0 ? void 0 : _b.trackAdMissedCallback) === null || _c === void 0 ? void 0 : _c.call(_b, {
            response: ads,
            metrics: metrics,
            reason: constants_1.VAST_AD_NOT_USED.EXIT_PRE_POD,
        });
    };
    WebAdapter.prototype.playAdTag = function (tag) {
        var _this = this;
        // const testTag = 'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator=';
        // const testTag = 'https://run.mocky.io/v3/aa55ece8-aab8-4c40-bb92-56c78055fa57';
        // const testInvalidVpaidTag = 'http://www.mocky.io/v2/59e53c711100007e07ec6899';
        // const testVpaidTag = 'http://mockbin.org/bin/49dc90b4-9ddd-4e7c-85a3-14e7e2149174';
        // const testVpaidTag = 'https://run.mocky.io/v3/740dac96-eea3-4089-9202-fcd665a7ff62';
        // const test500Tag = 'http://www.mocky.io/v2/5b867cb1340000db018b5612';
        // const testAdPlayerTag = 'https://www.mocky.io/v2/5d773dc83200009bd1297e15';
        // const multiTag = 'https://run.mocky.io/v3/9b8aad4f-a7dd-44dc-93f8-8b370d885d28';
        if (this.isAdFetching || this.isAd())
            return;
        this.isAdFetching = true;
        var requestPosition = this.getPosition();
        var adRequestProcessBeforeFetch = this.config.adRequestProcessBeforeFetch;
        this.emit(constants_1.PLAYER_EVENTS.adPodFetch, {
            isPreroll: this.isPlayingPreroll,
        });
        (0, adTools_1.fetchJsonAds)(tag, {
            requestProcessBeforeFetch: adRequestProcessBeforeFetch,
        }).then(function (_a) {
            var ads = _a.ads, metrics = _a.metrics;
            _this.emit(constants_1.PLAYER_EVENTS.adPodFetchSuccess, {
                isPreroll: _this.isPlayingPreroll,
                responseTime: metrics.responseTime,
            });
            if (_this.getState() === constants_1.State.destroyed) {
                _this.trackAdMissed({ ads: ads, metrics: metrics });
                return;
            }
            _this.isAdFetching = false;
            // NOTE: remove the poster to avoid the splash when adPlayer switching resource
            _this.videoElement.poster = '';
            _this.playAdResponse(ads, metrics, requestPosition);
        }, function (error) {
            _this.isAdFetching = false;
            _this.emit(constants_1.PLAYER_EVENTS.adPodFetchError, {
                isPreroll: _this.isPlayingPreroll,
                message: error === null || error === void 0 ? void 0 : error.message,
                retries: error === null || error === void 0 ? void 0 : error.retries,
            });
            var isResumeFromPreroll = _this.isPlayingPreroll;
            _this.isPlayingPreroll = false;
            _this.resume(isResumeFromPreroll);
        });
    };
    WebAdapter.prototype.playAdResponse = function (adResponse, metrics, requestPosition) {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isResumeFromPreroll, exception_2;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.log('playAdResponse:adplayer', adResponse);
                        if (this.getState() === constants_1.State.destroyed)
                            return [2 /*return*/];
                        // Handle empty ad response
                        if (adResponse.length === 0) {
                            this.emit(constants_1.PLAYER_EVENTS.adPodEmpty, {
                                isPreroll: this.isPlayingPreroll,
                            });
                            isResumeFromPreroll = this.isPlayingPreroll;
                            this.isPlayingPreroll = false;
                            this.resume(isResumeFromPreroll);
                            return [2 /*return*/];
                        }
                        if (this.isPictureInPictureMode) {
                            document.exitPictureInPicture();
                        }
                        this.emit(constants_1.PLAYER_EVENTS.adResponse, {
                            response: adResponse,
                            isPreroll: this.isPreroll(),
                            metrics: metrics,
                            requestPosition: requestPosition,
                        });
                        this.pause();
                        if (!this.shouldReuseVideoElement()) return [3 /*break*/, 5];
                        this.updateFramesData(); // need to record the content frames data before video element is switched to playing ad
                        (_a = this.detachVideoElementEvents) === null || _a === void 0 ? void 0 : _a.call(this);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.destroyHls()];
                    case 2:
                        _c.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        exception_2 = _c.sent();
                        /* istanbul ignore next */
                        this.log(exception_2, 'Error while destroying extension before cue point.');
                        return [3 /*break*/, 4];
                    case 4:
                        this.isVideoElementUsedByAdsInAdPlayer = true;
                        _c.label = 5;
                    case 5:
                        this.hideVideoElementIfNotReuseVideoElement();
                        this.setupAdClient();
                        (_b = this.adClient) === null || _b === void 0 ? void 0 : _b.playAdResponse(adResponse);
                        return [2 /*return*/];
                }
            });
        });
    };
    WebAdapter.prototype.resume = function (isFromPreroll) {
        var _a, _b;
        this.log('resume', this.shouldReuseVideoElement(), this.isAd(), this.getPosition());
        this.emit(constants_1.PLAYER_EVENTS.startLoad, {
            isResumeFromAd: true,
            isResumeFromPreroll: isFromPreroll,
        });
        this.currentTimeProgressed = false;
        this.resumePosition = this.contentPosition;
        if (this.shouldReuseVideoElement()) {
            if (!this.isVideoElementUsedByAdsInAdPlayer) {
                this.play();
                return;
            }
            this.isVideoElementUsedByAdsInAdPlayer = false;
            (_a = this.detachFairPlayEvents) === null || _a === void 0 ? void 0 : _a.call(this);
            (_b = this.detachVideoElementEvents) === null || _b === void 0 ? void 0 : _b.call(this);
            this.setup(true, isFromPreroll);
            return;
        }
        this.videoElement.style.visibility = 'visible';
        /* istanbul ignore else */
        if (!this.isPlaybackStarted) {
            // Load the media url if using dedicated content player and pre-roll ads finish
            this.setup(true, isFromPreroll);
        }
        else {
            // otherwise, directly resume the dedicated content player
            this.play();
        }
    };
    WebAdapter.prototype.getCaptions = function () {
        return this.captionsIndex;
    };
    WebAdapter.prototype.setCaptions = function (index) {
        var _this = this;
        this.log('setCaptions', index, this.captionsIndex);
        if (this.captionsIndex === index)
            return;
        this.captionsIndex = index;
        this.captionsUnits = [];
        this.emit(constants_1.PLAYER_EVENTS.captionsChange, { captionsIndex: this.captionsIndex });
        if (this.captionsIndex === 0) {
            if (this.captionsElement) {
                this.captionsElement.innerHTML = '';
            }
            this.hideCaptions();
            return;
        }
        var currentCaptions = this.captionsList[this.captionsIndex];
        (0, captions_1.fetchData)(currentCaptions.id, !!this.config.forceFetchPolyfill)
            .then(function (data) {
            _this.captionsUnits = data;
            _this.showCaptions();
        })
            .catch(function (error) {
            _this.log('fetch subtitle error', error);
            _this.emit(constants_1.PLAYER_EVENTS.captionsError, {
                type: types_1.CaptionsErrorType.CAPTIONS_ERROR,
                message: error.message,
            });
            // if something bad happens, just turn off captions
            _this.setCaptions(0);
        });
    };
    Object.defineProperty(WebAdapter.prototype, "captionsList", {
        get: function () {
            if (this._captionsList.length === 0) {
                return [];
            }
            return tslib_1.__spreadArray([constants_1.FROZEN_CAPTIONS_OFF], this._captionsList, true);
        },
        enumerable: false,
        configurable: true
    });
    WebAdapter.prototype.setCaptionsList = function (captionsList) {
        this._captionsList = captionsList;
        // if no valid captions, return without adding a unnecessary `off` option
        if (captionsList.length === 0)
            return;
        this.emit(constants_1.PLAYER_EVENTS.captionsListChange, { captionsList: this.captionsList });
        this.emit(constants_1.PLAYER_EVENTS.allCaptionsAvailable, { captionsList: this.captionsList });
    };
    WebAdapter.prototype.setCaptionsStyles = function (captionsStyles) {
        this.captionsStyles = captionsStyles;
        this.captionsStylesString = (0, captions_1.convertStyleObjectToString)(captionsStyles.font);
        this.emit(constants_1.PLAYER_EVENTS.captionsStylesChange, { captionsStyles: captionsStyles });
    };
    WebAdapter.prototype.getCaptionsList = function () {
        return this.captionsList;
    };
    WebAdapter.prototype.getMute = function () {
        return this.videoElement.muted;
    };
    WebAdapter.prototype.setMute = function (mute) {
        var _a;
        this.setVideoElementMute(mute);
        this.emit(constants_1.PLAYER_EVENTS.mute, { mute: mute });
        (0, localStorage_1.setLocalStorageData)(constants_1.PLAYER_STORAGE_MUTE, "".concat(mute));
        (_a = this.adClient) === null || _a === void 0 ? void 0 : _a.setVolume(mute ? 0 : this.getVolume());
    };
    WebAdapter.prototype.getVolume = function () {
        return Math.floor(this.videoElement.volume * 100);
    };
    /**
     * set the volume of the player between 1-100
     */
    WebAdapter.prototype.setVolume = function (volume) {
        this.setVideoElementVolume(volume);
        this.emit(constants_1.PLAYER_EVENTS.volume, { volume: volume });
        this.setMute(false);
        (0, localStorage_1.setLocalStorageData)(constants_1.PLAYER_STORAGE_VOLUME, "".concat(volume));
        if (this.isAd() && this.adClient) {
            this.adClient.setVolume(volume);
        }
    };
    WebAdapter.prototype.getAutoLevelEnabled = function () {
        var _a, _b;
        return (_b = (_a = this.hls) === null || _a === void 0 ? void 0 : _a.autoLevelEnabled) !== null && _b !== void 0 ? _b : false;
    };
    WebAdapter.prototype.setQuality = function (index) {
        var _this = this;
        if (!this.hls) {
            return;
        }
        this.emit(constants_1.PLAYER_EVENTS.qualityChange, { qualityIndex: index });
        if (index === 0) {
            // index=-1 means Auto in Hls.js
            this.hls.nextLevel = -1;
            return;
        }
        var hlsLevelIndex = this.hls.levels.findIndex(function (level) { return level.bitrate === _this.qualityLevelList[index].bitrate; });
        this.hls.nextLevel = hlsLevelIndex;
    };
    /**
     * set prerollUrl
     */
    WebAdapter.prototype.setPrerollUrl = function (url) {
        this.config.prerollUrl = url;
    };
    WebAdapter.prototype.isAd = function () {
        return this.isPlayingAd;
    };
    WebAdapter.prototype.updateCaptionsWindowStyle = function (isCaptionEmpty) {
        var _a, _b, _c, _d;
        // emptying out captions, hide background div
        if (isCaptionEmpty && this.captionsElement.style.background) {
            this.captionsElement.style.background = '';
            return;
        }
        // add background if we have text to display
        /* istanbul ignore else */
        if (((_a = this.captionsStyles) === null || _a === void 0 ? void 0 : _a.type) === constants_1.Platform.web) {
            this.captionsElement.style.background = (_d = (_c = (_b = this.captionsStyles) === null || _b === void 0 ? void 0 : _b.window) === null || _c === void 0 ? void 0 : _c.background) !== null && _d !== void 0 ? _d : '';
        }
    };
    WebAdapter.prototype.isSupported = function () {
        // NOTE: skip check for Edge 18 as MediaSource.isTypeSupported() is inconsistent
        // https://github.com/video-dev/hls.js/issues/2026
        // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/20178865/
        // https://caniuse.com/#feat=mediasource
        var ua = (0, ua_parser_1.default)();
        var _a = ua.browser, name = _a.name, version = _a.version;
        /* istanbul ignore else */
        if (version && version.split('.').length) {
            var majorVersion = Number(version.split('.')[0]);
            if (name === 'Edge' && majorVersion === 18) {
                return true;
            }
        }
        // We always support webkit-based browsers on iPhones as we
        // fall back to the video element.
        if ((0, ua_sniffing_1.isWebkitIPhone)(ua)) {
            return true;
        }
        return WebAdapter.Hls.isSupported();
    };
    WebAdapter.prototype.init = function () {
        var _a = this.config, poster = _a.poster, mute = _a.mute, captionsStyles = _a.captionsStyles;
        if (poster && this.videoElement) {
            this.videoElement.poster = poster;
        }
        // initialize volume/mute
        var shouldMute = JSON.parse("".concat(typeof mute === 'undefined' ? (0, localStorage_1.getLocalStorageData)(constants_1.PLAYER_STORAGE_MUTE) : mute));
        if (shouldMute) {
            this.setVideoElementMute(true);
        }
        var volume = JSON.parse("".concat((0, localStorage_1.getLocalStorageData)(constants_1.PLAYER_STORAGE_VOLUME)));
        if (volume !== null) {
            this.setVideoElementVolume(volume);
        }
        if (captionsStyles)
            this.setCaptionsStyles(captionsStyles);
    };
    WebAdapter.prototype.handleUnsupported = function () {
        var _this = this;
        var warningElement = this.playerContainerElement.querySelector("[data-id=\"".concat(WebAdapter.WARNING_COMPONENT_ID, "\"]"));
        warningElement.textContent = "\n      Oops, your web browser is no longer supported.\n      Please upgrade to a modern, fully supported browser\n    ";
        warningElement.style.display = 'block';
        // queue ready and error events
        setTimeout(function () {
            _this.isReadyEmitted = true;
            _this.emit(constants_1.PLAYER_EVENTS.ready);
            _this.emit(constants_1.PLAYER_EVENTS.error, {
                type: constants_1.ErrorType.SETUP_ERROR,
                message: 'browser is no longer supported',
                fatal: true,
                errorSource: constants_1.ERROR_SOURCE.OTHER,
            });
        }, 0);
    };
    WebAdapter.prototype.setupFairPlay = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, drmKeySystem, licenseUrl, serverCertificateUrl, forceFetchPolyfill, req, cert;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.log('setup FairPlay');
                        _a = this.config, drmKeySystem = _a.drmKeySystem, licenseUrl = _a.licenseUrl, serverCertificateUrl = _a.serverCertificateUrl, forceFetchPolyfill = _a.forceFetchPolyfill;
                        return [4 /*yield*/, (0, fetchWrapper_1.fetchWrapper)(serverCertificateUrl, {}, !!forceFetchPolyfill)];
                    case 1:
                        req = _b.sent();
                        return [4 /*yield*/, req.arrayBuffer()];
                    case 2:
                        cert = _b.sent();
                        this.detachFairPlayEvents = (0, fairplay_1.setup)(this.videoElement, drmKeySystem, licenseUrl, new Uint8Array(cert), this.onVideoElementError);
                        // use the HTML5 video element to handle FairPlay DRM playback
                        this.videoElement.src = this.mediaUrl;
                        return [2 /*return*/];
                }
            });
        });
    };
    WebAdapter.prototype.setVideoElementMute = function (mute) {
        this.videoElement.muted = mute;
    };
    WebAdapter.prototype.setVideoElementVolume = function (volume) {
        this.videoElement.volume = volume / 100;
    };
    WebAdapter.prototype.setState = function (state) {
        this.state = state;
    };
    WebAdapter.prototype.startBuffering = function (reason) {
        if (this.isContentBuffering)
            return;
        var currentTime = this.videoElement.currentTime;
        this.isContentBuffering = true;
        this.emit(constants_1.PLAYER_EVENTS.bufferStart, {
            reason: reason,
            currentTime: currentTime,
        });
    };
    WebAdapter.prototype.stopBuffering = function (reason) {
        var currentTime = this.videoElement.currentTime;
        this.isContentBuffering = false;
        this.emit(constants_1.PLAYER_EVENTS.bufferEnd, { reason: reason, currentTime: currentTime });
    };
    WebAdapter.prototype.showCaptions = function () {
        this.captionsElement.style.display = 'block';
    };
    WebAdapter.prototype.hideCaptions = function () {
        this.captionsElement.style.display = 'none';
    };
    WebAdapter.prototype.updateCaptions = function () {
        var _this = this;
        var _a, _b, _c;
        if (this.captionsUnits.length === 0)
            return;
        var unit = (0, captions_1.locate)(this.getPosition(), this.captionsUnits);
        var captionsText = unit
            ? unit.text.map(function (line) { return "<span style=\"".concat(_this.captionsStylesString, "\">").concat(line, "</span>"); }).join('<br />')
            : '';
        if (captionsText !== this.previousCaptionsText) {
            this.captionsElement.innerHTML = captionsText;
            this.previousCaptionsText = captionsText;
            /* istanbul ignore else */
            if (((_a = this.captionsStyles) === null || _a === void 0 ? void 0 : _a.type) === constants_1.Platform.web && ((_c = (_b = this.captionsStyles) === null || _b === void 0 ? void 0 : _b.window) === null || _c === void 0 ? void 0 : _c.background)) {
                this.updateCaptionsWindowStyle(captionsText === '');
            }
        }
    };
    /**
     * the player has been initialized and is ready for playback,
     * trigger `ready` event and do some initializations here.
     */
    WebAdapter.prototype.notifyPlayerReady = function () {
        this.log('notifyPlayerReady');
        if (this.isReadyEmitted)
            return;
        this.isReadyEmitted = true;
        this.emit(constants_1.PLAYER_EVENTS.ready);
        // initialize captions
        /* istanbul ignore else */
        if (this.config.subtitles) {
            // FIXME simplify subtitle/captions conversion
            this.setCaptionsList(this.config.subtitles.map(function (subtitle) { return ({
                id: subtitle.url,
                label: subtitle.label || subtitle.lang,
                lang: subtitle.lang,
            }); }));
            if (this.config.defaultCaptions) {
                var index = (0, captions_1.getCaptionIndex)(this.getCaptionsList(), this.config.defaultCaptions);
                this.setCaptions(index);
            }
        }
    };
    WebAdapter.prototype.setupAdClient = function () {
        if (this.adClient) {
            return;
        }
        var experimentalConfig = this.config.experimentalConfig;
        this.emit(constants_1.PLAYER_EVENTS.adPlayerSetup, this.isPreroll());
        this.adClient = new progressiveMp4AdPlayer_1.default({
            container: this.adContainerElement,
            videoElement: this.videoElement,
            reuseVideoElement: this.shouldReuseVideoElement(),
            debug: (0, tools_1.isPlayerDebugEnabled)(this.config.debugLevel),
            volume: this.getMute() ? 0 : this.getVolume(),
            clickThroughEnabled: true,
            performanceCollectorEnabled: this.config.performanceCollectorEnabled,
            isPreroll: this.isPreroll(),
            abnormalErrorConstrainView: experimentalConfig === null || experimentalConfig === void 0 ? void 0 : experimentalConfig.adAbnormalErrorConstrainView,
            enableAdBlockedCheck: true,
            /**
             * In webkit on iPhones, the video element fies a `suspended` event and
             * never gets to `loadeddata` if we do not call `load()` after setting a
            * new src
            */
            loadBetweenAds: (0, ua_sniffing_1.isWebkitIPhone)((0, ua_parser_1.default)()),
        });
        this.attachAdClientEvents();
    };
    WebAdapter.prototype.destroyHls = function () {
        // There are async operations, so we add a flag to avoid executing them multiple times
        if (!this.hls)
            return;
        window.clearTimeout(this.mediaAttachTimer);
        this.hls.destroy();
        delete this.hls;
        return this.videoElement.setMediaKeys(null);
    };
    WebAdapter.prototype.attachAdClientEvents = function () {
        var _this = this;
        var adClient = this.adClient;
        var resumeContentPlayback = function (isFromPreroll) {
            _this.showCaptions();
            adClient === null || adClient === void 0 ? void 0 : adClient.remove();
            delete _this.adClient;
            _this.isPlayingPreroll = false;
            _this.resume(isFromPreroll);
        };
        /* istanbul ignore if */
        if (!adClient)
            return;
        adClient.on(constants_1.PLAYER_EVENTS.adStart, function (data) {
            _this.log('Adapter adStart');
            _this.isPlayingAd = true;
            _this.emit(constants_1.PLAYER_EVENTS.adStart, data);
            _this.hideCaptions();
        });
        adClient.on(constants_1.PLAYER_EVENTS.adBufferStart, function (data) {
            _this.log('Adapter adBufferStart');
            _this.emit(constants_1.PLAYER_EVENTS.adBufferStart, data);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adBufferEnd, function (data) {
            _this.log('Adapter adBufferEnd');
            _this.emit(constants_1.PLAYER_EVENTS.adBufferEnd, data);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adPlay, function () {
            _this.log('Adapter adPlay');
            _this.emit(constants_1.PLAYER_EVENTS.adPlay);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adPlaying, function () {
            _this.log('Adapter adPlaying');
            _this.setState(constants_1.State.playing);
            _this.emit(constants_1.PLAYER_EVENTS.adPlaying);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adPause, function () {
            _this.log('Adapter adPause');
            _this.setState(constants_1.State.paused);
            _this.emit(constants_1.PLAYER_EVENTS.adPause);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adComplete, function (data) {
            _this.log('Adapter adComplete');
            _this.isPlayingAd = false;
            _this.emit(constants_1.PLAYER_EVENTS.adComplete, data);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adPodComplete, function (event) {
            _this.log('Adapter adPodComplete');
            _this.isPlayingAd = false;
            _this.emit(constants_1.PLAYER_EVENTS.adPodComplete, tslib_1.__assign({ position: _this.getPosition() }, event));
            resumeContentPlayback(event.isPreroll);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adPodEmpty, function (data) {
            _this.log('Adapter adPodEmpty');
            _this.isPlayingAd = false;
            _this.emit(constants_1.PLAYER_EVENTS.adPodEmpty, data);
            resumeContentPlayback(data.isPreroll);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adTime, function (data) {
            _this.log('Adapter adTime');
            _this.emit(constants_1.PLAYER_EVENTS.adTime, data);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adHealthScoreLow, function (data) {
            _this.log('Adapter adHealthScoreLow');
            _this.emit(constants_1.PLAYER_EVENTS.adHealthScoreLow, data);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adError, function (error, data) {
            _this.log('Adapter adError', error);
            _this.emit(constants_1.PLAYER_EVENTS.adError, error, data);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adClick, function (url) {
            _this.log('Adapter adClick', url);
            _this.emit(constants_1.PLAYER_EVENTS.adClick, url);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adBeaconFail, function (error, data) {
            _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, error, data);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adIconVisible, function (data) {
            _this.emit(constants_1.PLAYER_EVENTS.adIconVisible, data);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adStall, function (data) {
            _this.log('Adapter adStall', data);
            _this.emit(constants_1.PLAYER_EVENTS.adStall, data);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adStartLoad, function () {
            _this.log('Adapter adStartLoad');
            _this.emit(constants_1.PLAYER_EVENTS.adStartLoad);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adCanPlay, function () {
            _this.log('Adapter adCanPlay');
            _this.emit(constants_1.PLAYER_EVENTS.adCanPlay);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adCurrentTimeProgressed, function () {
            _this.log('Adapter adCurrentTimeProgressed');
            _this.emit(constants_1.PLAYER_EVENTS.adCurrentTimeProgressed);
        });
        adClient.on(constants_1.PLAYER_EVENTS.adQuartile, function (adQuartile) {
            _this.log("ad playback reaches ".concat(adQuartile, " quartile"));
            _this.emit(constants_1.PLAYER_EVENTS.adQuartile, adQuartile);
        });
    };
    WebAdapter.prototype.attachVideoElementEvents = function () {
        var _this = this;
        var listenerMap = {
            durationchange: this.onDurationChange,
            loadedmetadata: this.onLoadedMetaData,
            loadeddata: this.onLoadedData,
            canplay: this.onCanPlay,
            playing: this.onPlaying,
            play: this.onPlay,
            pause: this.onPause,
            seeking: this.onSeeking,
            seeked: this.onSeeked,
            timeupdate: this.onTimeupdate,
            waiting: this.onWaiting,
            ended: this.onEnded,
            error: this.onVideoElementError,
            enterpictureinpicture: function () {
                _this.isPictureInPictureMode = true;
                _this.emit(constants_1.PLAYER_EVENTS.enterPictureInPicture);
            },
            leavepictureinpicture: function () {
                _this.isPictureInPictureMode = false;
                _this.emit(constants_1.PLAYER_EVENTS.leavePictureInPicture);
            },
        };
        Object.keys(listenerMap).forEach(function (eventName) {
            _this.videoElement.addEventListener(eventName, listenerMap[eventName]);
        });
        return function () {
            Object.keys(listenerMap).forEach(function (eventName) {
                _this.videoElement.removeEventListener(eventName, listenerMap[eventName]);
            });
        };
    };
    WebAdapter.prototype.isNoAudioTrack = function (hls) {
        return hls.audioTrack === undefined;
    };
    WebAdapter.prototype.checkBufferDataEnough = function (type, isBufferEnough) {
        /* istanbul ignore next */
        if (!this.hls)
            return;
        this.bufferDataEnough[type] = isBufferEnough;
        if (isBufferEnough && this.bufferDataEnough.video && (this.isNoAudioTrack(this.hls) || this.bufferDataEnough.audio)) {
            this.emit(constants_1.PLAYER_EVENTS.bufferDataEnough);
        }
    };
    WebAdapter.prototype.attachPlayerEvents = function () {
        var _this = this;
        // resume to previous position
        var resumePosition = this.contentPosition;
        if (resumePosition > 0) {
            this.once(constants_1.PLAYER_EVENTS.time, function () {
                _this.seek(resumePosition, 'continueWatch');
            });
        }
        // if there is no Hls.js player instance and we should use native HTML5 video element, call `play` if `autoStart` is positive
        if (!this.hls) {
            if (!this.shouldUseHls) {
                if ((0, isAutoStartEnabled_1.isAutoStartEnabled)(this.config) || this.isPlaybackStarted) {
                    this.play();
                }
            }
            return;
        }
        var Hls = WebAdapter.Hls;
        // Hls.js events
        this.hls.on(Hls.Events.MEDIA_ATTACHED, function (event, data) {
            _this.log('Hls.Events.MEDIA_ATTACHED', data);
            _this.loadSource();
            window.clearTimeout(_this.mediaAttachTimer);
        });
        this.hls.on(Hls.Events.MANIFEST_LOADED, function () {
            _this.manifestLoadTimeoutRetryCount = 0;
        });
        this.hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            _this.log('Hls.Events.MANIFEST_PARSED', data);
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
            if ((0, isAutoStartEnabled_1.isAutoStartEnabled)(_this.config) || _this.isPlaybackStarted) {
                _this.play();
            }
        });
        // Quality
        var lastHlsLevelIndex = -1;
        this.hls.on(Hls.Events.FRAG_CHANGED, function (event, data) {
            var _a;
            var hlsLevelIndex = data.frag.level;
            if (lastHlsLevelIndex === hlsLevelIndex)
                return;
            lastHlsLevelIndex = hlsLevelIndex;
            var hlsLevel = (_a = _this.hls) === null || _a === void 0 ? void 0 : _a.levels[hlsLevelIndex];
            var qualityIndex = _this.qualityLevelList.findIndex(function (level) { return level.bitrate === (hlsLevel === null || hlsLevel === void 0 ? void 0 : hlsLevel.bitrate); });
            _this.log('Hls.Events.FRAG_CHANGED visualQualityChange', data);
            _this.emit(constants_1.PLAYER_EVENTS.visualQualityChange, {
                qualityIndex: qualityIndex,
                level: _this.qualityLevelList[qualityIndex],
            });
        });
        this.hls.on(Hls.Events.BUFFER_DATA_ENOUGH, function (event, data) {
            _this.checkBufferDataEnough(data.type === 'audio' ? 'audio' : 'video', true);
        });
        this.hls.on(Hls.Events.BUFFER_EOS, function (event, data) {
            _this.checkBufferDataEnough(data.type === 'audio' ? 'audio' : 'video', true);
        });
        // Buffer
        this.hls.on(Hls.Events.BUFFER_APPENDED, function () {
            var buffered = _this.videoElement.buffered;
            if (buffered.length === 0)
                return;
            var bufferPercent = Math.max(Math.min(buffered.end(buffered.length - 1) / _this.getDuration(), 1), 0);
            _this.emit(constants_1.PLAYER_EVENTS.bufferChange, {
                bufferPercent: 100 * bufferPercent,
                position: _this.getPosition(),
                duration: _this.getDuration(),
            });
        });
        this.hls.on(Hls.Events.FRAG_LOADING, function (event, data) {
            _this.cdn = (0, tools_1.getUrlHost)(data.frag.url);
            _this.checkBufferDataEnough(data.frag.type === 'audio' ? 'audio' : 'video', false);
        });
        this.hls.on(Hls.Events.FRAG_BUFFERED, function () {
            _this.stopBuffering(constants_1.StopBufferingReason.hls_frag_buffered_event);
        });
        // Ignore init segments download data because of no media duration, and init segments download will not trigger Events.FRAG_LOADED
        this.hls.on(Hls.Events.FRAG_LOADED, function (event, data) {
            if (data.frag.type === 'subtitle')
                return;
            var fragType = data.frag.type === 'audio' ? 'audio' : 'video';
            _this.fragDownloadStats[fragType].totalDownloadSize += data.frag.stats.total; // bits
            _this.fragDownloadStats[fragType].totalDownloadTimeConsuming += data.frag.stats.loading.end - data.frag.stats.loading.start; // milliseconds
            _this.fragDownloadStats[fragType].totalDownloadFragDuration += data.frag.duration; // seconds
        });
        this.hls.on(Hls.Events.ERROR, function (_event, data) {
            var _a = data !== null && data !== void 0 ? data : {}, type = _a.type, details = _a.details, fatal = _a.fatal;
            var HlsErrorDetails = Hls.ErrorDetails;
            if (details === HlsErrorDetails.BUFFER_STALLED_ERROR) {
                _this.startBuffering(constants_1.StartBufferingReason.hls_buffer_stall_event);
            }
            if (!fatal && type !== Hls.ErrorTypes.KEY_SYSTEM_ERROR)
                return;
            // These attributes are cyclic.
            var loader = data.loader, context = data.context, networkDetails = data.networkDetails, rest = tslib_1.__rest(data, ["loader", "context", "networkDetails"]);
            _this.emit(constants_1.PLAYER_EVENTS.error, tslib_1.__assign(tslib_1.__assign({}, rest), { message: (0, hlsExtension_1.buildHlsErrorMessage)(data, Hls), errorSource: constants_1.ERROR_SOURCE.HLS_EXTENSION_ERROR }));
        });
        this.hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, this.onAudioTracksAvailable);
    };
    WebAdapter.prototype.setMediaUrl = function (mediaUrl, position, config) {
        var _a, _b, _c;
        if (position === void 0) { position = 0; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var exception_3;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!this.isAd() || !this.shouldReuseVideoElement()) {
                            this.updateFramesData(); // need to record the content frames data before video element resets media url
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.destroyHls()];
                    case 2:
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        exception_3 = _d.sent();
                        this.log(exception_3, 'Error while destroying extension before set media url.');
                        this.emit(constants_1.PLAYER_EVENTS.error, {
                            type: constants_1.ErrorType.OTHER_ERROR,
                            message: 'hls extension destroy exception',
                            fatal: false,
                            errorSource: constants_1.ERROR_SOURCE.OTHER,
                        });
                        return [3 /*break*/, 4];
                    case 4:
                        this.config.drmKeySystem = config.drmKeySystem;
                        this.config.licenseUrl = config.licenseUrl;
                        this.config.hdcpVersion = config.hdcpVersion;
                        this.config.serverCertificateUrl = config.serverCertificateUrl;
                        if (this.shouldUseHls && (0, types_1.isHlsExtensionConfig)(this.config.extensionConfig)) {
                            if (config.hasOwnProperty('drmSystemOptions')) {
                                if (config.drmSystemOptions === undefined) {
                                    delete this.config.extensionConfig.hls.drmSystemOptions;
                                }
                                else {
                                    this.config.extensionConfig.hls.drmSystemOptions = config.drmSystemOptions;
                                }
                            }
                            this.config.extensionConfig.hls.startPosition = position > 0 ? position : -1;
                        }
                        this.mediaUrl = mediaUrl;
                        this.contentPosition = position;
                        (_a = this.performanceCollector) === null || _a === void 0 ? void 0 : _a.destroy();
                        clearTimeout(this.mediaAttachTimer);
                        (_b = this.detachFairPlayEvents) === null || _b === void 0 ? void 0 : _b.call(this);
                        (_c = this.detachVideoElementEvents) === null || _c === void 0 ? void 0 : _c.call(this);
                        if (!this.isPlaybackStarted) {
                            this.onPlay();
                        }
                        if (!!this.isAd()) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.setup()];
                    case 5:
                        _d.sent();
                        _d.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    WebAdapter.prototype.recoverHlsError = function (error) {
        var Hls = WebAdapter.Hls;
        switch (error.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
                return this.recoverHlsNetworkError(error);
            case Hls.ErrorTypes.MEDIA_ERROR:
                return this.recoverHlsMediaError(error);
            default:
                return false;
        }
    };
    WebAdapter.prototype.recoverHlsNetworkError = function (error) {
        if (!this.hls)
            return false;
        var Hls = WebAdapter.Hls;
        if (error.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
            if (this.manifestLoadTimeoutRetryCount < constants_1.MAX_HLS_MANIFEST_LOAD_TIMEOUT_RETRY_COUNT) {
                this.manifestLoadTimeoutRetryCount++;
                this.emit(constants_1.PLAYER_EVENTS.reload);
                this.loadSource();
                return true;
            }
            this.destroyHls();
        }
        else if (this.recoverNetworkErrorCount < constants_1.MAX_RECOVER_HLS_NETWORK_ERROR_COUNT) {
            this.recoverNetworkErrorCount++;
            this.hls.startLoad();
            return true;
        }
        return false;
    };
    WebAdapter.prototype.recoverHlsMediaError = function (error) {
        if (!this.hls)
            return false;
        var Hls = WebAdapter.Hls;
        if (error.details !== Hls.ErrorDetails.BUFFER_APPEND_ERROR && this.recoverMediaErrorCount < constants_1.MAX_RECOVER_HLS_MEDIA_ERROR_COUNT) {
            this.recoverMediaErrorCount++;
            this.hls.config.startPosition = this.getPrecisePosition();
            this.emit(constants_1.PLAYER_EVENTS.reattachVideoElement);
            this.hls.recoverMediaError();
            return true;
        }
        return false;
    };
    WebAdapter.prototype.getCurrentAudioTrack = function () {
        if (!this.shouldUseHls) {
            if (!this.videoElement)
                return;
            if (typeof this.videoElement.audioTracks === 'undefined')
                return;
            for (var _i = 0, _a = Array.from(this.videoElement.audioTracks); _i < _a.length; _i++) {
                var track = _a[_i];
                if (track.enabled)
                    return (0, audioTrack_1.convertHTML5AudioTrackToAudioTrackInfo)(track);
            }
            return;
        }
        if (!this.hls)
            return;
        var _b = this.hls, audioTracks = _b.audioTracks, audioTrack = _b.audioTrack;
        var currentTrack = audioTracks[audioTrack];
        if (!currentTrack)
            return;
        return (0, audioTrack_1.convertHLSAudioTrackToAudioTrackInfo)(currentTrack, currentTrack.id);
    };
    WebAdapter.prototype.getAudioTracks = function () {
        if (!this.shouldUseHls) {
            if (!this.videoElement)
                return [];
            if (typeof this.videoElement.audioTracks === 'undefined')
                return [];
            return Array.from(this.videoElement.audioTracks).map(audioTrack_1.convertHTML5AudioTrackToAudioTrackInfo);
        }
        if (!this.hls)
            return [];
        var _a = this.hls, audioTracks = _a.audioTracks, audioTrack = _a.audioTrack;
        var currentTrack = audioTracks[audioTrack];
        return audioTracks.map(function (track) { return (0, audioTrack_1.convertHLSAudioTrackToAudioTrackInfo)(track, currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id); });
    };
    WebAdapter.prototype.setAudioTrack = function (info) {
        if (!this.videoElement) {
            throw new Error('We can\'t set the audio track without video element');
        }
        if (!this.shouldUseHls) {
            if (typeof this.videoElement.audioTracks === 'undefined') {
                throw new Error('Lack of audio track API');
            }
            Array.from(this.videoElement.audioTracks).forEach(function (track) {
                track.enabled = (0, audioTrack_1.isSameHTML5AudioTrack)(track, info);
            });
            return true;
        }
        if (!this.hls) {
            throw new Error('We can\'t set audio track without hls instance');
        }
        var audioTracks = this.hls.audioTracks;
        var index = audioTracks.findIndex(function (track) { return track.id === info.id; });
        this.hls.audioTrack = index;
        return true;
    };
    WebAdapter.prototype.updateFramesData = function () {
        var _a = (0, tools_1.getVideoPlaybackQuality)(this.videoElement), totalVideoFrames = _a.totalVideoFrames, droppedVideoFrames = _a.droppedVideoFrames;
        if (totalVideoFrames === undefined || droppedVideoFrames === undefined)
            return;
        this.decodedFrames += totalVideoFrames;
        this.droppedFrames += droppedVideoFrames;
    };
    WebAdapter.prototype.getVideoPlaybackQuality = function () {
        var _a = (0, tools_1.getVideoPlaybackQuality)(this.videoElement), totalVideoFrames = _a.totalVideoFrames, droppedVideoFrames = _a.droppedVideoFrames;
        if (totalVideoFrames === undefined || droppedVideoFrames === undefined)
            return {};
        var plusCurrentFrames = !(this.isAd() && this.shouldReuseVideoElement());
        return {
            totalVideoFrames: this.decodedFrames + (plusCurrentFrames ? totalVideoFrames : 0),
            droppedVideoFrames: this.droppedFrames + (plusCurrentFrames ? droppedVideoFrames : 0),
        };
    };
    WebAdapter.VIDEO_COMPONENT_ID = 'videoPlayerComponent';
    WebAdapter.CAPTIONS_COMPONENT_ID = 'captionsComponent';
    WebAdapter.AD_COMPONENT_ID = 'adComponent';
    WebAdapter.WARNING_COMPONENT_ID = 'warningComponent';
    WebAdapter.htmlString = "\n    <div data-id=\"".concat(constants_1.PLAYER_CONTAINER_IDS.hls, "\">\n      <video data-id=\"").concat(WebAdapter.VIDEO_COMPONENT_ID, "\"></video>\n      <div data-id=\"").concat(WebAdapter.CAPTIONS_COMPONENT_ID, "\"></div>\n      <div data-id=\"").concat(WebAdapter.AD_COMPONENT_ID, "\"></div>\n      <div data-id=\"").concat(WebAdapter.WARNING_COMPONENT_ID, "\" style=\"display: none\"></div>\n    </div>\n  ");
    WebAdapter.loadScript = function (config) {
        if (config === void 0) { config = {}; }
        if ((0, types_1.isHlsExtensionConfig)(config.extensionConfig) && config.extensionConfig.externalHlsResolver) {
            var hlsResolver = config.extensionConfig.externalHlsResolver
                .then(function (ExternalHls) {
                WebAdapter.Hls = ExternalHls;
            });
            return Promise.all([
                hlsResolver,
            ]);
        }
        return Promise.all([Promise.reject('extensionConfig.externalHlsResolver must have value!')]);
    };
    return WebAdapter;
}(PlayerEventEmitter_1.PlayerEventEmitter));
exports.default = WebAdapter;
//# sourceMappingURL=web.js.map