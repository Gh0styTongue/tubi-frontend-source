"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var time_1 = require("@adrise/utils/lib/time");
var constants_1 = require("../constants");
var isAutoStartEnabled_1 = require("../interceptor/isAutoStartEnabled");
var types_1 = require("../types");
var adTools_1 = require("../utils/adTools");
var audioTrack_1 = require("../utils/audioTrack");
var captions_1 = require("../utils/captions");
var config_1 = require("../utils/config");
var dom_1 = require("../utils/dom");
var hlsAdPlayer_1 = tslib_1.__importDefault(require("../utils/hlsAdPlayer"));
var hlsExtension_1 = tslib_1.__importDefault(require("../utils/hlsExtension"));
var hlsFragmentCache_1 = require("../utils/hlsFragmentCache");
var nativeAdPlayer_1 = tslib_1.__importDefault(require("../utils/nativeAdPlayer"));
var performanceCollector_1 = require("../utils/performanceCollector");
var PlayerEventEmitter_1 = require("../utils/PlayerEventEmitter");
var progressiveMp4AdPlayer_1 = tslib_1.__importDefault(require("../utils/progressiveMp4AdPlayer"));
var tools_1 = require("../utils/tools");
var BUFFER_TIME_THRESHOLD = 300;
// Safety margin in seconds to avoid precision issues when checking buffer near end of content
var EXIT_BUFFER_LEVEL_BUFFER_MARGIN = 0.1;
var MAX_REBUFFERING_END_EXIT_BUFFER_LEVEL_TIME = 5000;
var MAX_STARTUP_END_EXIT_BUFFER_LEVEL_TIME = 5000;
/**
 * Player adapter for HTML5 video element
 * Spec: https://html.spec.whatwg.org/multipage/media.html
 */
var Html5Adapter = /** @class */ (function (_super) {
    tslib_1.__extends(Html5Adapter, _super);
    function Html5Adapter(config) {
        var _this = _super.call(this) || this;
        _this.loadCount = 0;
        _this.state = constants_1.State.idle;
        _this.contentDuration = 0;
        _this.isReadyEmitted = false;
        _this.isContentBuffering = false;
        _this.isPlaybackStarted = false;
        _this.isDestroyingExtension = false;
        // Ad
        _this.isAdFetching = false;
        _this.isVideoElementUsedByAds = false;
        _this._captionsList = [];
        _this.captionsIndex = 0;
        _this.captionsUnits = [];
        _this.captionsFontStyle = '';
        _this.previousCaptionsText = '';
        _this.lastBufferEnd = 0;
        _this.currentTimeProgressed = false;
        _this.isSeeking = false;
        _this.hlsErrorReloadMediaUrlCount = 0;
        _this.isPlayingPreroll = false;
        _this.closeToLastPrerollAdsEmitted = false;
        _this.customPlaybackHandlers = [];
        _this.decodedFrames = 0;
        _this.droppedFrames = 0;
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
        _this.abrLoggingData = {
            common: {
                max_buffer_length: 0,
                levels: [],
                startup: {
                    default_bandwidth_estimate: 0,
                    start_level: -1,
                },
            },
            switch_info: [],
            time_series: {
                time_start: [],
                buffer_length: [],
                bandwidth_estimate: [],
                play_bitrate: [],
                ttfb_estimate: [],
            },
            download_speed: [],
            bitrate_oscillation: {
                total_bitrate_oscillation: 0,
                played_fragments: 0,
            },
        };
        _this.sdkName = 'unknown';
        _this.isExtensionPreInited = false;
        _this.bufferEventHandler = function () {
            var _a = _this.videoElement, buffered = _a.buffered, duration = _a.duration, position = _a.currentTime;
            if (buffered.length === 0 || duration === 0)
                return;
            var bufferEnd = 0;
            for (var i = 0; i < buffered.length; i++) {
                var end = buffered.end(i);
                if (Math.floor(buffered.start(i)) <= position && Math.ceil(end) >= position) {
                    bufferEnd = end;
                    break;
                }
            }
            if (_this.lastBufferEnd !== bufferEnd) {
                _this.lastBufferEnd = bufferEnd;
                var bufferPercent = Math.max(Math.min(bufferEnd / duration, 1), 0);
                _this.emit(constants_1.PLAYER_EVENTS.bufferChange, {
                    bufferPercent: 100 * bufferPercent,
                    position: position,
                    duration: duration,
                });
            }
        };
        _this.onDurationChange = function () {
            if (_this.isAd()) {
                return;
            }
            _this.contentDuration = _this.videoElement.duration;
        };
        _this.onLoadedMetadata = function () {
            _this.log('onLoadedMetadata', _this.isReadyEmitted);
            if (_this.isReadyEmitted)
                return;
            _this.recoverForceAutoPreloadAttribute();
        };
        /**
         *
         * Handle video element `loadeddata` event, mainly to emit `ready` event.
         * On some browsers, like Safari, seekable.length is 0 when `loadedmetadata` emits, so we use `loadeddata` to be safe.
         * @link https://stackoverflow.com/questions/5981427/start-html5-video-at-a-particular-position-when-loading
         */
        _this.onLoadedData = function () {
            _this.log('onLoadedData', _this.isReadyEmitted);
            if (_this.isReadyEmitted)
                return;
            _this.isReadyEmitted = true;
            // Initialize captions
            /* istanbul ignore else */
            if (_this.config.subtitles) {
                _this.setCaptionsList(_this.config.subtitles.map(function (subtitle) { return ({
                    id: subtitle.url,
                    label: subtitle.label || subtitle.lang,
                    lang: subtitle.lang,
                }); }));
                if (_this.config.defaultCaptions) {
                    var index = (0, captions_1.getCaptionIndex)(_this.getCaptionsList(), _this.config.defaultCaptions);
                    _this.setCaptions(index);
                }
            }
            _this.emit(constants_1.PLAYER_EVENTS.ready);
            _this.log(constants_1.PLAYER_EVENTS.ready);
            if (!_this.extension)
                _this.onAudioTracksAvailable();
        };
        _this.onLoadStart = function () {
            _this.log('onLoadStart', _this.state);
            _this.setState(constants_1.State.idle);
            _this.startBuffering(constants_1.StartBufferingReason.el_load_start);
        };
        _this.onWaiting = function () {
            _this.log('onWaiting', _this.state);
            _this.waitingEventStartBufferingTime = (0, time_1.now)();
            // Don't emit "buffer" event if state is "complete"
            if (_this.getState() !== constants_1.State.completed) {
                _this.startBuffering(constants_1.StartBufferingReason.el_waiting_event);
            }
        };
        _this.onCanPlay = function () {
            _this.log('onCanPlay', _this.state);
            _this.emit(constants_1.PLAYER_EVENTS.canPlay, {
                isResumePositionBuffered: _this.isResumePositionBuffered(),
            });
            _this.stopBuffering(constants_1.StopBufferingReason.el_canplay_event);
        };
        _this.onPlaying = function () {
            var _a;
            _this.log('onPlaying');
            (_a = _this.removeStartupListener) === null || _a === void 0 ? void 0 : _a.call(_this);
            /**
             * `playing` is fired from the video element after seeked,
             * but `play` isn't, so we reuse the same logic here
             * @link https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Media_events
             */
            if (_this.getState() !== constants_1.State.playing) {
                _this.onPlay();
            }
        };
        _this.onPlay = function () {
            _this.log('onPlay');
            _this.isPlaybackStarted = true;
            _this.stopBuffering(constants_1.StopBufferingReason.el_play_event);
            _this.setState(constants_1.State.playing);
            _this.emit(constants_1.PLAYER_EVENTS.play);
            _this.recoverForceAutoPreloadAttribute();
        };
        _this.onPause = function () {
            if (_this.state === constants_1.State.completed)
                return;
            _this.log('onPause');
            _this.syncPauseState();
            _this.emit(constants_1.PLAYER_EVENTS.pause);
        };
        _this.onSeeking = function () {
            _this.isSeeking = true;
            _this.emit(constants_1.PLAYER_EVENTS.seeking);
            if (_this.getExperimentalConfig().enableHlsCacheFragments) {
                hlsFragmentCache_1.HlsFragmentCache.getInstance().reduceFragmentCacheByCurrentTime(_this.videoElement.currentTime);
            }
        };
        _this.onVideoElementSeeked = function () {
            var seekEndBufferLevel = _this.getExperimentalConfig().seekEndBufferLevel;
            if (seekEndBufferLevel && !_this.isBufferLevelAchieved(seekEndBufferLevel)) {
                return;
            }
            _this.onSeeked();
        };
        _this.onFragBuffered = function () {
            var _a = _this.getExperimentalConfig(), seekEndBufferLevel = _a.seekEndBufferLevel, rebufferingEndBufferLevel = _a.rebufferingEndBufferLevel, startupEndBufferLevel = _a.startupEndBufferLevel;
            if (_this.isSeeking
                && !_this.videoElement.seeking
                && seekEndBufferLevel
                && _this.isBufferLevelAchieved(seekEndBufferLevel)) {
                _this.onSeeked();
            }
            else if (_this.isContentBuffering
                && _this.isPendingForBufferLevel()
                && _this.getExperimentalConfig().rebufferingEndBufferLevel
                && _this.isBufferLevelAchieved(rebufferingEndBufferLevel)) {
                _this.stopBuffering(constants_1.StopBufferingReason.rebuffering_end_buffer_level_achieved);
                _this.cleanExitBufferLevelTimer();
            }
            else if (_this.isPendingForBufferLevel()
                && _this.getExperimentalConfig().startupEndBufferLevel
                && _this.isBufferLevelAchieved(startupEndBufferLevel)) {
                _this.cleanExitBufferLevelTimer();
            }
        };
        _this.onMediaAttached = function () {
            _this.tryStartupBufferLevel();
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
            var preventEarlyExitCheckInTimeupdateEvent = _this.getExperimentalConfig().preventEarlyExitCheckInTimeupdateEvent;
            var _a = _this.videoElement, duration = _a.duration, position = _a.currentTime, readyState = _a.readyState;
            _this.log('onTimeupdate', position, _this.getPosition(), _this.isDestroyingExtension, _this.getState());
            // Some devices may trigger a time update event when its src changes.
            // We need to ignore it.
            // This happens on the Vizio.
            if (Number.isNaN(duration)) {
                return;
            }
            /**
             * there might be a 'timeupdate' event with position 0 when destroying Hls instance before
             * entering a mid-roll ad, we need to ignore it to avoid starting over
             */
            /* istanbul ignore next */
            if (_this.isDestroyingExtension && position === 0) {
                return;
            }
            // If state is completed, just return
            if (_this.getState() === constants_1.State.completed) {
                return;
            }
            if (!_this.isSeeking && !_this.currentTimeProgressed && Math.abs(position - _this.resumePosition) > constants_1.CURRENT_TIME_PROGRESSED_THRESHOLD) {
                _this.currentTimeProgressed = true;
                _this.emit(constants_1.PLAYER_EVENTS.currentTimeProgressed);
            }
            if (position !== _this.getPosition()) {
                // Sometimes the timeupdate event would later than waiting event, we need to eliminate this case
                // The BUFFER_TIME_THRESHOLD is set according to https://app.periscopedata.com/app/adrise:tubi/1036816/WebOTT-Buffer-Ratio
                if (_this.isContentBuffering
                    && (!_this.waitingEventStartBufferingTime || (0, time_1.now)() - _this.waitingEventStartBufferingTime > BUFFER_TIME_THRESHOLD)) {
                    _this.stopBuffering(constants_1.StopBufferingReason.el_timeupdate_event_1);
                }
                /**
                 * There is a rare case that no `play` event emits in the video element if there is a hls.js error `bufferNudgeOnStall`
                 * on Xboxone when playing from completed, so we check here whether the player state and correct it if necessary
                 */
                if (_this.getState() !== constants_1.State.playing && _this.isVideoElementPlaying()) {
                    _this.onPlay();
                }
            }
            /**
             * todo(@benji): this hack might be removed someday.
             *
             * video element will trigger "timeupdate" with same position multiple times (not same in different browsers),
             * which can indicate that playback is stalled
             */
            /* istanbul ignore next */
            if (!preventEarlyExitCheckInTimeupdateEvent
                && _this.getDuration() > 0
                && _this.getDuration() - position < 1) {
                // cancel "buffering" state
                _this.stopBuffering(constants_1.StopBufferingReason.el_timeupdate_event_2);
                // "pause" and "complete" as https://www.w3.org/TR/2011/WD-html5-20110113/video.html#ended-playback said
                if (_this.getState() !== constants_1.State.completed) {
                    _this.onPause();
                    _this.onEnded();
                }
                return;
            }
            /**
             * The `time` event can sometimes be emitted before our `ready` event.
             * We need to wait until data has loaded and buffered before emitting the `time` event.
             * This will also increase the likelihood that our `firstFrame` event is emitted
             * when the first frame is rendered.
             *
             * Note: On Sony(deprecated), we do not know the difference between an empty buffered range
             * representing nothing is buffered or we don't know the buffered range yet.
             * This is why we check if the buffered range is undefined.
             */
            var hasLoadedData = readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
            var bufferedRange = _this.getBufferedRange();
            var hasBufferedData = bufferedRange === undefined || bufferedRange.length > 0;
            if (hasLoadedData && hasBufferedData) {
                var experimentalConfig = _this.getExperimentalConfig();
                var enableDiluteTimeEvent = experimentalConfig.enableDiluteTimeEvent;
                // Emit different events based on experiment flags
                if (enableDiluteTimeEvent) {
                    // Only emit timeSeconds when position reaches an integer value (0, 1, 2, etc.)
                    var flooredPosition = Math.floor(position);
                    if (flooredPosition !== Math.floor(_this.contentPosition)) {
                        _this.emit(constants_1.PLAYER_EVENTS.timeSeconds, {
                            position: flooredPosition,
                            duration: _this.getDuration(),
                        });
                    }
                }
                // NormalLevel: Emit standard time event on every timeupdate
                _this.contentPosition = position;
                _this.emit(constants_1.PLAYER_EVENTS.time, {
                    position: _this.getPosition(),
                    duration: _this.getDuration(),
                });
                _this.updateCaptions();
            }
        };
        _this.onEnded = function () {
            if (_this.state === constants_1.State.completed)
                return;
            _this.log('onEnded');
            _this.stopBuffering(constants_1.StopBufferingReason.el_ended_event);
            _this.setState(constants_1.State.completed);
            _this.emit(constants_1.PLAYER_EVENTS.complete);
        };
        _this.onVideoElementError = function (error) {
            _this.emit(constants_1.PLAYER_EVENTS.error, _this.getVideoErrorEventData(error));
        };
        _this.onExtensionError = function (data) {
            _this.emit(constants_1.PLAYER_EVENTS.error, data);
        };
        _this.onCapLevelOnFPSDrop = function (data) {
            _this.emit(constants_1.PLAYER_EVENTS.capLevelOnFPSDrop, data);
        };
        _this.onQualityListChange = function (_a) {
            var qualityList = _a.qualityList;
            _this.emit(constants_1.PLAYER_EVENTS.qualityListChange, {
                qualityList: qualityList,
            });
        };
        _this.onSegmentTimelineMisalignment = function (data) {
            _this.emit(constants_1.PLAYER_EVENTS.segmentTimelineMisalignment, data);
        };
        _this.onVisualQualityChange = function (data) {
            _this.emit(constants_1.PLAYER_EVENTS.visualQualityChange, data);
        };
        _this.onQualityChange = function (data) {
            _this.emit(constants_1.PLAYER_EVENTS.qualityChange, data);
        };
        _this.onBufferDataEnough = function () {
            _this.emit(constants_1.PLAYER_EVENTS.bufferDataEnough);
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
                    var audioTrackToSet_1 = audioTracks.find(function (audioTrack) {
                        return audioTrack.role === defaultAudioTrack.role && audioTrack.language === defaultAudioTrack.language;
                    });
                    if (audioTrackToSet_1) {
                        return new Promise(function (resolve) {
                            if (!_this.extension) {
                                _this.setAudioTrack(audioTrackToSet_1);
                                return resolve();
                            }
                            _this.extension.once(constants_1.PLAYER_EVENTS.audioTracksChange, function () {
                                resolve();
                            });
                            _this.setAudioTrack(audioTrackToSet_1);
                        });
                    }
                }
            }
            var currentAudioTrack = _this.getCurrentAudioTrack();
            if ((currentAudioTrack === null || currentAudioTrack === void 0 ? void 0 : currentAudioTrack.role) === 'description') {
                var audioTracks = _this.getAudioTracks();
                var mainAudioTrack_1 = audioTracks.find(function (audioTrack) { return audioTrack.role === 'main'; });
                if (mainAudioTrack_1) {
                    return new Promise(function (resolve) {
                        if (!_this.extension) {
                            _this.setAudioTrack(mainAudioTrack_1);
                            return resolve();
                        }
                        _this.extension.once(constants_1.PLAYER_EVENTS.audioTracksChange, function () {
                            resolve();
                        });
                        _this.setAudioTrack(mainAudioTrack_1);
                    });
                }
            }
            return Promise.resolve();
        };
        _this.onAudioTracksAvailable = function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.setDefaultAudioTrack()];
                    case 1:
                        _a.sent();
                        this.emit(constants_1.PLAYER_EVENTS.audioTracksAvailable, this.getAudioTracks());
                        return [2 /*return*/];
                }
            });
        }); };
        _this.onReload = function () { return _this.emit(constants_1.PLAYER_EVENTS.reload); };
        _this.onReattachVideoElement = function () { return _this.emit(constants_1.PLAYER_EVENTS.reattachVideoElement); };
        _this.onRestrictedQualityListChange = function (data) {
            _this.emit(constants_1.PLAYER_EVENTS.restrictedQualityListChange, data);
        };
        _this.onFragBeforeCuePointMayCache = function () {
            _this.emit(constants_1.PLAYER_EVENTS.fragBeforeCuePointMayCache);
        };
        _this.getHlsFragmentCacheStats = function () {
            return hlsFragmentCache_1.HlsFragmentCache.getInstance().getStats();
        };
        _this.canHitHlsFragmentCache = function () {
            var _a;
            var position = _this.contentPosition;
            var isAVFragMixed = _this.getAudioTracks().length === 0;
            var hlsInstance = (_a = _this.extension) === null || _a === void 0 ? void 0 : _a.getHlsInstance();
            if (!hlsInstance)
                return undefined;
            return hlsFragmentCache_1.HlsFragmentCache.getInstance().canHitCache({
                position: position,
                isAVFragMixed: isAVFragMixed,
                currentVideoLevelIndex: hlsInstance.nextLoadLevel,
                currentAudioTrackIndex: hlsInstance.audioTrack,
            });
        };
        // set the max listeners to 15 to avoid warnings.
        _this.setMaxListeners(15);
        _this.mediaUrl = config.mediaUrl;
        _this.config = config;
        _this.playerContainerElement = config.playerContainer;
        _this.resumePosition = _this.contentPosition = config.resumePosition || 0;
        _this.log = (0, tools_1.isPlayerDebugEnabled)(config.debugLevel) ? (0, tools_1.debug)('Html5Adapter') : function () { };
        _this.html5AdapterContainerElement = _this.playerContainerElement.querySelector("[data-id=\"".concat(constants_1.PLAYER_CONTAINER_IDS.html5, "\"]"));
        _this.videoElement = _this.playerContainerElement.querySelector("[data-id=\"".concat(Html5Adapter.VIDEO_COMPONENT_ID, "\"]"));
        _this.adContainerElement = _this.playerContainerElement.querySelector("[data-id=\"".concat(Html5Adapter.AD_COMPONENT_ID, "\"]"));
        _this.captionsElement = _this.playerContainerElement.querySelector("[data-id=\"".concat(Html5Adapter.CAPTIONS_AREA_ID, "\"]"));
        _this.captionsWindowElement = _this.playerContainerElement.querySelector("[data-id=\"".concat(Html5Adapter.CAPTIONS_WINDOW_ID, "\"]"));
        return _this;
    }
    Html5Adapter.prototype.getExternalVideoObject = function () {
        return this.videoElement;
    };
    Html5Adapter.prototype.getExperimentalConfig = function () {
        return this.config.experimentalConfig || {};
    };
    Object.defineProperty(Html5Adapter.prototype, "SDKName", {
        get: function () {
            return this.sdkName;
        },
        enumerable: false,
        configurable: true
    });
    Html5Adapter.prototype.getSDKVersion = function () {
        if (Html5Adapter.Hls) {
            return Html5Adapter.Hls.version;
        }
    };
    Html5Adapter.prototype.getHlsInstanceConfig = function () {
        var _a, _b;
        return (_b = (_a = this.extension) === null || _a === void 0 ? void 0 : _a.getHlsInstance()) === null || _b === void 0 ? void 0 : _b.config;
    };
    Html5Adapter.prototype.setup = function () {
        var _this = this;
        var _a = this.config, prerollUrl = _a.prerollUrl, preFetchPrerollAds = _a.preFetchPrerollAds, debugLevel = _a.debugLevel, cuePoints = _a.cuePoints;
        var _b = this.getExperimentalConfig(), enableHlsCacheFragments = _b.enableHlsCacheFragments, enableCacheFragmentsBroadenRange = _b.enableCacheFragmentsBroadenRange, enableHlsDetachDuringAds = _b.enableHlsDetachDuringAds, enableSeekWithResumePosition = _b.enableSeekWithResumePosition;
        var enableWorker = (0, config_1.buildHlsConfig)(this.config).enableWorker;
        this.addVideoElementEvents();
        hlsFragmentCache_1.HlsFragmentCache.getInstance().init({
            isDebug: !!(0, tools_1.isPlayerDebugEnabled)(debugLevel),
            maxFragmentsCacheDurationAfterCuePoint: enableHlsCacheFragments !== null && enableHlsCacheFragments !== void 0 ? enableHlsCacheFragments : 0,
            cuePoints: cuePoints,
            isCacheInitSegment: !enableHlsDetachDuringAds,
            cacheFragmentsNearPositionZero: !!enableSeekWithResumePosition,
            appendCallback: this.onFragBeforeCuePointMayCache,
            getContentPosition: this.getPosition.bind(this),
            enableWorker: enableWorker,
            enableCacheFragmentsBroadenRange: enableCacheFragmentsBroadenRange,
        });
        if (prerollUrl) {
            this.isPlayingPreroll = true;
            // If we try to play prerollUrl, that means we have no time to set up the video element for the content. So we can consider the video element has been used by ads no matter if it has ads.
            this.isVideoElementUsedByAds = true;
            if (typeof preFetchPrerollAds === 'object' && typeof preFetchPrerollAds.then === 'function') {
                preFetchPrerollAds.then(function (ads) {
                    _this.emit(constants_1.PLAYER_EVENTS.adPodFetchSuccess, {
                        isPreroll: true,
                        responseTime: -1,
                        adsCount: ads.length,
                        isPrefetchAds: true,
                        skipTracking: true,
                    });
                    _this.playAdResponse(ads);
                }).catch(function () {
                    _this.playAdTag(prerollUrl);
                });
                return;
            }
            this.playAdTag(prerollUrl);
        }
        else {
            if (!this.mediaUrl) {
                if (this.config.playerName === types_1.PlayerName.AD) {
                    return;
                }
                throw new Error('No media url provided');
            }
            var startLoadEventData = {
                isResumeFromAd: false,
                isResumeFromPreroll: false,
                startLoadType: 'startup',
            };
            this.emit(constants_1.PLAYER_EVENTS.startLoad, startLoadEventData);
            this.currentTimeProgressed = false;
            this.load(this.mediaUrl, this.getPosition(), startLoadEventData);
        }
    };
    Html5Adapter.prototype.reload = function (_a) {
        return tslib_1.__awaiter(this, arguments, void 0, function (_b) {
            var position = _b.position, skipPreroll = _b.skipPreroll;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.clean()];
                    case 1:
                        _c.sent();
                        if (skipPreroll) {
                            this.config.prerollUrl = undefined;
                        }
                        if (position !== undefined) {
                            this.contentPosition = position;
                        }
                        this.setup();
                        return [2 /*return*/];
                }
            });
        });
    };
    Html5Adapter.prototype.setMediaSrc = function (url, autoplay) {
        if (autoplay === void 0) { autoplay = false; }
        var isHlsUrl = (0, tools_1.isHls)(url);
        // Setting a new media src is currently only supported for mp4/html5 playback
        if (isHlsUrl)
            throw new Error('HLS urls are not supported by `setMediaSrc`');
        if (!autoplay) {
            // Disable autoplay for video previews as the client will explicitly play the preview
            this.config.preload = undefined;
            this.videoElement.autoplay = false;
            this.isPlaybackStarted = false;
        }
        var startLoadEventData = {
            isResumeFromAd: false,
            isResumeFromPreroll: false,
            startLoadType: 'setMediaSrc',
        };
        this.load(url, 0, startLoadEventData);
    };
    Html5Adapter.prototype.setQuality = function (index) {
        if (this.extension) {
            this.extension.setQuality(index);
        }
    };
    Html5Adapter.prototype.getAdUrl = function () {
        var _a;
        return (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.getAdUrl();
    };
    Html5Adapter.prototype.getCurrentAd = function () {
        var _a;
        return (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.getCurrentAd();
    };
    Html5Adapter.prototype.getAdList = function () {
        var _a;
        return (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.getAdList();
    };
    Html5Adapter.prototype.getAdSequence = function () {
        var _a;
        return (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.getAdSequence();
    };
    Html5Adapter.prototype.getAdLagTime = function () {
        var _a;
        return ((_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.getLagTime()) || -1;
    };
    /**
     * Get the current player state
     */
    Html5Adapter.prototype.getState = function () {
        return this.state;
    };
    Html5Adapter.prototype.getCurrentVideoElement = function () {
        var _a, _b;
        return (_b = (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.getVideoElement()) !== null && _b !== void 0 ? _b : this.videoElement;
    };
    Html5Adapter.prototype.getContentVideoElement = function () {
        return this.videoElement;
    };
    /**
     * The buffered range from the video element itself
     */
    Html5Adapter.prototype.getBufferedRange = function () {
        if (this.adPlayer) {
            return this.adPlayer.getBufferedRange();
        }
        var buffered = this.videoElement.buffered;
        /**
         * On Sony(deprecated), we don't know whether an empty buffered array represents that
         * nothing is buffered or that we don't know how much is buffered.
         * So we check if the buffered array is empty and if so, return undefined
         * to represent that we don't know how much is buffered.
         */
        var bufferedArray = (0, tools_1.transBufferedRangesIntoArray)(buffered);
        if (bufferedArray.length === 0 && (0, dom_1.isVirginMedia)()) {
            return undefined;
        }
        return bufferedArray;
    };
    /**
     * The buffered range of the video stream as understood by
     * the extension
     */
    Html5Adapter.prototype.getBufferedVideoRange = function () {
        if (this.adPlayer) {
            /* istanbul ignore next */
            return this.adPlayer.getBufferedRange();
        }
        /* istanbul ignore next */
        if (!this.extension)
            return [];
        /* istanbul ignore next */
        if (!this.extension.getVideoBuffered)
            return [];
        return (0, tools_1.transBufferedRangesIntoArray)(this.extension.getVideoBuffered());
    };
    /**
     * The buffered range of the audio stream as understood by
     * the extension
     */
    Html5Adapter.prototype.getBufferedAudioRange = function () {
        if (this.adPlayer) {
            /* istanbul ignore next */
            return this.adPlayer.getBufferedRange();
        }
        /* istanbul ignore next */
        if (!this.extension)
            return [];
        /* istanbul ignore next */
        if (!this.extension.getAudioBuffered)
            return [];
        return (0, tools_1.transBufferedRangesIntoArray)(this.extension.getAudioBuffered());
    };
    Html5Adapter.prototype.getBufferedLength = function (maxHoleDuration) {
        var _a;
        if (maxHoleDuration === void 0) { maxHoleDuration = 0; }
        var position = this.isAd() ? (_a = this.adPlayer.getAdPosition()) !== null && _a !== void 0 ? _a : 0 : this.getPrecisePosition();
        var bufferedRange = this.getBufferedRange();
        if (bufferedRange === undefined)
            return 0;
        return (0, tools_1.getBufferedInfo)(bufferedRange, position, maxHoleDuration).len;
    };
    /**
     * Is video buffered at the playhead?
     */
    Html5Adapter.prototype.getIsCurrentTimeVideoBuffered = function () {
        var position = this.adPlayer ? this.adPlayer.getAdPosition() : this.getPrecisePosition();
        // the position will be the same as the duration when the video is ended
        var isEnded = this.adPlayer ? this.adPlayer.isAdEnded() : this.videoElement.ended;
        if (isEnded)
            return true;
        var bufferedVideoRange = this.getBufferedVideoRange();
        var bufferedRange = this.getBufferedRange();
        if (bufferedRange === undefined)
            return false;
        return (0, tools_1.isTimeInBufferedRange)(position, bufferedVideoRange.length === 0 && this.state === constants_1.State.destroyed ? bufferedRange : bufferedVideoRange);
    };
    /**
     * Is audio buffered at the playhead?
     */
    Html5Adapter.prototype.getIsCurrentTimeAudioBuffered = function () {
        var position = this.adPlayer ? this.adPlayer.getAdPosition() : this.getPrecisePosition();
        // the position will be the same as the duration when the video is ended
        var isEnded = this.adPlayer ? this.adPlayer.isAdEnded() : this.videoElement.ended;
        if (isEnded)
            return true;
        var bufferedAudioRange = this.getBufferedAudioRange();
        var bufferedRange = this.getBufferedRange();
        if (bufferedRange === undefined)
            return false;
        return (0, tools_1.isTimeInBufferedRange)(position, bufferedAudioRange.length === 0 && this.state === constants_1.State.destroyed ? bufferedRange : bufferedAudioRange);
    };
    /**
     * Get the current playback position, in seconds
     */
    Html5Adapter.prototype.getPosition = function () {
        return this.contentPosition;
    };
    /**
     * Get the current precise playback position, in seconds
     * We only use this for stall detection
     */
    Html5Adapter.prototype.getPrecisePosition = function () {
        return this.videoElement.currentTime;
    };
    /**
     * get ad current playback position, in seconds
     */
    Html5Adapter.prototype.getAdPosition = function () {
        var _a;
        return (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.getAdPosition();
    };
    /**
     * Get the current playing ad duration, in seconds
     */
    Html5Adapter.prototype.getAdDuration = function () {
        var _a;
        return (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.getAdDuration();
    };
    /**
     * Get the current playback duration, in seconds
     */
    Html5Adapter.prototype.getDuration = function () {
        return this.contentDuration;
    };
    /**
     * Get the current playback bitrate, in bits/s
     */
    Html5Adapter.prototype.getBitrate = function (needManifestBitrate) {
        var _a, _b;
        if (needManifestBitrate === void 0) { needManifestBitrate = false; }
        return (_b = (_a = this.extension) === null || _a === void 0 ? void 0 : _a.getBitrate(needManifestBitrate)) !== null && _b !== void 0 ? _b : -1;
    };
    /**
     * Get the CDN name of the current playback
     */
    Html5Adapter.prototype.getCDN = function () {
        if (this.extension) {
            return this.extension.getCDN();
        }
        return (0, tools_1.getUrlHost)(this.mediaUrl);
    };
    Html5Adapter.prototype.getVideoCodec = function () {
        var _a, _b;
        if (!this.extension) {
            return '';
        }
        return (_b = (_a = this.extension.getCurrentLevel()) === null || _a === void 0 ? void 0 : _a.videoCodec) !== null && _b !== void 0 ? _b : '';
    };
    Html5Adapter.prototype.getAudioCodec = function () {
        var _a, _b;
        if (!this.extension) {
            return '';
        }
        return (_b = (_a = this.extension.getCurrentLevel()) === null || _a === void 0 ? void 0 : _a.audioCodec) !== null && _b !== void 0 ? _b : '';
    };
    Html5Adapter.prototype.getCodecs = function () {
        var _a;
        if (!this.extension) {
            return '';
        }
        var currentLevel = this.extension.getCurrentLevel();
        if (!currentLevel) {
            return '';
        }
        return (_a = currentLevel.codecSet) !== null && _a !== void 0 ? _a : "".concat(currentLevel.videoCodec, ",").concat(currentLevel.audioCodec);
    };
    Html5Adapter.prototype.getFrameRate = function () {
        var _a, _b;
        if (!this.extension) {
            return '';
        }
        var currentLevel = this.extension.getCurrentLevel();
        if (!currentLevel) {
            return '';
        }
        return (_b = (_a = currentLevel.attrs) === null || _a === void 0 ? void 0 : _a['FRAME-RATE']) !== null && _b !== void 0 ? _b : '';
    };
    /**
     * Get the current playback bitrate, in bits/s
     */
    Html5Adapter.prototype.getBandwidthEstimate = function () {
        var _a, _b;
        return (_b = (_a = this.extension) === null || _a === void 0 ? void 0 : _a.getBandwidthEstimate()) !== null && _b !== void 0 ? _b : -1;
    };
    Html5Adapter.prototype.getFragDownloadStats = function () {
        this.updateFragDownloadStats();
        return this.fragDownloadStats;
    };
    Html5Adapter.prototype.getFragDownloadInfo = function () {
        var _a;
        return (_a = this.extension) === null || _a === void 0 ? void 0 : _a.getFragDownloadInfo();
    };
    Html5Adapter.prototype.getCurrentAudioTrack = function () {
        if (!this.videoElement)
            return;
        if (this.extension)
            return this.extension.getCurrentAudioTrack();
        if (typeof this.videoElement.audioTracks === 'undefined')
            return;
        for (var _i = 0, _a = Array.from(this.videoElement.audioTracks); _i < _a.length; _i++) {
            var track = _a[_i];
            if (track.enabled)
                return (0, audioTrack_1.convertHTML5AudioTrackToAudioTrackInfo)(track);
        }
    };
    Html5Adapter.prototype.getAudioTracks = function () {
        if (!this.videoElement)
            return [];
        if (this.extension)
            return this.extension.getAudioTracks();
        if (typeof this.videoElement.audioTracks === 'undefined')
            return [];
        return Array.from(this.videoElement.audioTracks).map(audioTrack_1.convertHTML5AudioTrackToAudioTrackInfo);
    };
    Html5Adapter.prototype.setAudioTrack = function (info) {
        if (!this.videoElement) {
            throw new Error('We can\'t set the audio track without video element');
        }
        if (this.extension)
            return this.extension.setAudioTrack(info);
        if (typeof this.videoElement.audioTracks === 'undefined') {
            throw new Error('Lack of audio track API');
        }
        Array.from(this.videoElement.audioTracks).forEach(function (track) {
            track.enabled = (0, audioTrack_1.isSameHTML5AudioTrack)(track, info);
        });
        return true;
    };
    Html5Adapter.prototype.getAutoLevelEnabled = function () {
        var _a, _b;
        return (_b = (_a = this.extension) === null || _a === void 0 ? void 0 : _a.getAutoLevelEnabled()) !== null && _b !== void 0 ? _b : false;
    };
    Html5Adapter.prototype.isPreroll = function () {
        return this.isPlayingPreroll;
    };
    /**
     * Start to play the media
     */
    Html5Adapter.prototype.play = function (options) {
        var _this = this;
        var _a;
        var isAd = this.isAd();
        this.log('play', isAd, this.isPlaybackStarted);
        if (!(options === null || options === void 0 ? void 0 : options.disableCleanExitBufferLevelTimer)) {
            this.cleanExitBufferLevelTimer();
        }
        if (isAd) {
            (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.play();
            return;
        }
        var loadCount = this.loadCount;
        (0, dom_1.safeVideoElementPlay)(this.videoElement).catch(function (error) {
            var _a, _b;
            if ((_this.state === 'destroyed' || (loadCount !== _this.loadCount))
                && ((_b = (_a = _this.getExperimentalConfig()).ignorePlayInterruptErrorInAd) === null || _b === void 0 ? void 0 : _b.call(_a))) {
                return;
            }
            _this.onVideoElementError(error);
        });
    };
    /**
     * Pause the playback
     */
    Html5Adapter.prototype.pause = function () {
        var _a;
        var isAd = this.isAd();
        this.log('pause', isAd);
        this.cleanExitBufferLevelTimer();
        if (isAd) {
            (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.pause();
            return;
        }
        // Some browsers will stop downloading when we pause the playback.
        // But they will preload the whole content under the autoplay attribute.
        // So we add the autoplay attribute back for the force auto preload mode.
        if (this.config.preload === 'force-auto') {
            this.videoElement.autoplay = true;
        }
        // NOTE Nothing happens if the media element's paused attribute is true.
        // @link https://html.spec.whatwg.org/multipage/media.html#dom-media-pause
        this.videoElement.pause();
    };
    /**
     * Seek to a new position
     * @param position new position, in seconds
     */
    Html5Adapter.prototype.seek = function (position, seekActionType) {
        if (seekActionType === void 0) { seekActionType = 'userAction'; }
        this.log('seek', position, this.isAdFetching, this.isAd());
        this.cleanExitBufferLevelTimer();
        if (this.isAdFetching || this.isAd())
            return;
        this.emit(constants_1.PLAYER_EVENTS.seek, {
            position: this.getPosition(),
            offset: position,
            seekActionType: seekActionType,
        });
        this.videoElement.currentTime = position;
    };
    Html5Adapter.prototype.pauseDownloadingSegments = function () {
        if (this.extension) {
            this.extension.pauseDownloadingSegments();
        }
    };
    Html5Adapter.prototype.resumeDownloadingSegments = function () {
        if (this.extension) {
            this.extension.resumeDownloadingSegments();
        }
    };
    Html5Adapter.prototype.removeLoadActionListener = function () {
        if (this.loadActionListener) {
            this.videoElement.removeEventListener('loadeddata', this.loadActionListener);
            this.loadActionListener = undefined;
        }
    };
    Html5Adapter.prototype.beforeRemove = function () {
        var _a;
        (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.beforeRemove();
        var expConfig = this.getExperimentalConfig();
        if (expConfig.enableAbortRainmakerRequest && this.abortAdFetch) {
            var errorData = this.abortAdFetch();
            if (errorData) {
                errorData.isPreroll = true;
                this.emit(constants_1.PLAYER_EVENTS.adPodFetchError, errorData);
            }
            this.abortAdFetch = undefined;
        }
    };
    /**
     * Attaches the events for the content video
     * element if they are not attached
     */
    Html5Adapter.prototype.addVideoElementEvents = function () {
        if (this.detachVideoElementEvents === undefined) {
            this.detachVideoElementEvents = this.attachVideoElementEvents();
        }
    };
    /**
     * Detaches the events for the content video
     * element if they are attached
     */
    Html5Adapter.prototype.removeVideoElementEvents = function () {
        this.cleanExitBufferLevelTimer();
        if (this.detachVideoElementEvents) {
            this.detachVideoElementEvents();
            this.detachVideoElementEvents = undefined;
        }
    };
    // Clean all event listeners and destroy all extensions / montiors/ ad players
    // This method can be used to reset player state with out destroy it, especially when we want to reload the content
    Html5Adapter.prototype.clean = function () {
        var _this = this;
        var _a;
        this.removeLoadActionListener();
        (_a = this.removeStartupListener) === null || _a === void 0 ? void 0 : _a.call(this);
        this.destroyPerformanceCollector();
        clearTimeout(this.preInitExtensionTimeoutCheckFn);
        if (this.adPlayer) {
            this.adPlayer.remove();
            this.adPlayer = undefined;
        }
        var afterDestroyingExtension = function () {
            _this.destroyCustomPlaybackHandlers();
            _this.removeVideoElementEvents();
            if (_this.getExperimentalConfig().enableHlsCacheFragments) {
                hlsFragmentCache_1.HlsFragmentCache.getInstance().clear();
            }
        };
        var destroyingExtension = this.destroyExtension();
        if (destroyingExtension) {
            return destroyingExtension.then(afterDestroyingExtension);
        }
        afterDestroyingExtension();
    };
    /**
     * Destruct player
     */
    Html5Adapter.prototype.remove = function () {
        var _this = this;
        this.log('remove');
        if (this.state === constants_1.State.destroyed) {
            return;
        }
        this.setState(constants_1.State.destroyed);
        this.removePreloadAdPlayer();
        var clean = this.clean();
        var afterClean = function () {
            (0, dom_1.removeVideoElement)(_this.videoElement);
        };
        if (clean) {
            return clean.then(afterClean);
        }
        afterClean();
    };
    Html5Adapter.prototype.destroyCustomPlaybackHandlers = function () {
        this.customPlaybackHandlers.forEach(function (customPlaybackHandler) {
            customPlaybackHandler.destroy();
        });
        this.customPlaybackHandlers = [];
    };
    /**
     * Indicate whether ad is playing now
     */
    Html5Adapter.prototype.isAd = function () {
        return !!this.adPlayer;
    };
    Html5Adapter.prototype.trackAdMissed = function (_a) {
        var _b, _c;
        var ads = _a.ads, metrics = _a.metrics;
        if (!ads || ads.length === 0)
            return;
        /* istanbul ignore next: ignore optional chaining */
        (_c = (_b = this.config) === null || _b === void 0 ? void 0 : _b.trackAdMissedCallback) === null || _c === void 0 ? void 0 : _c.call(_b, {
            response: ads,
            metrics: metrics,
            reason: 'exitBeforeResponse',
            scene: constants_1.VAST_AD_NOT_USED.EXIT_PRE_POD,
            isPreroll: this.isPreroll(),
        });
    };
    /**
     * Fetch ad tag and then play it if valid
     * @param adTagUrl ad tag
     */
    Html5Adapter.prototype.playAdTag = function (adTagUrl) {
        var _this = this;
        var _a, _b, _c, _d;
        this.log('playAdTag');
        if (this.isAdFetching || this.isAd())
            return;
        this.destroyPerformanceCollector();
        this.isAdFetching = true;
        var requestPosition = this.getPosition();
        var adRequestProcessBeforeFetch = this.config.adRequestProcessBeforeFetch;
        this.emit(constants_1.PLAYER_EVENTS.adPodFetch, {
            isPreroll: this.isPlayingPreroll,
        });
        var ignoreErroredAds = (_b = (_a = this.config).getIgnoreErroredAds) === null || _b === void 0 ? void 0 : _b.call(_a);
        var experimentalConfig = this.getExperimentalConfig();
        var prerollConfig = experimentalConfig.prerollRequestConfig;
        var fetchResult = (0, adTools_1.fetchJsonAds)(adTagUrl, {
            requestProcessBeforeFetch: adRequestProcessBeforeFetch,
            ignoreErroredAds: ignoreErroredAds,
            timeout: (_c = prerollConfig === null || prerollConfig === void 0 ? void 0 : prerollConfig.timeout) !== null && _c !== void 0 ? _c : adTools_1.DEFAULT_TIMEOUT,
            maxRetries: (_d = prerollConfig === null || prerollConfig === void 0 ? void 0 : prerollConfig.retry) !== null && _d !== void 0 ? _d : adTools_1.DEFAULT_MAX_RETRIES,
            adBeaconFailedHandler: function (error, adId) {
                _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, error, { id: adId, type: 'error' });
            },
            onRetry: function (retries) {
                _this.emit(constants_1.PLAYER_EVENTS.adPodRetry, {
                    isPreroll: _this.isPlayingPreroll,
                    retries: retries,
                });
            },
        });
        this.abortAdFetch = fetchResult.abort;
        fetchResult.then(function (_a) {
            var ads = _a.ads, metrics = _a.metrics;
            _this.abortAdFetch = undefined;
            _this.emit(constants_1.PLAYER_EVENTS.adPodFetchSuccess, {
                isPreroll: _this.isPlayingPreroll,
                responseTime: metrics.responseTime,
                adsCount: ads.length,
                timeout: metrics.timeout,
                retries: metrics.retries,
                networkResponseTime: metrics.networkResponseTime,
                maxRetries: metrics.maxRetries,
            });
            if (_this.getState() === constants_1.State.destroyed) {
                _this.trackAdMissed({ ads: ads, metrics: metrics });
                return;
            }
            _this.isAdFetching = false;
            _this.playAdResponse(ads, { metrics: metrics, requestPosition: requestPosition });
        }, function (error) {
            _this.abortAdFetch = undefined;
            _this.isAdFetching = false;
            _this.emit(constants_1.PLAYER_EVENTS.adPodFetchError, {
                isPreroll: _this.isPlayingPreroll,
                message: error.message,
                retries: error.retries,
                overlappingRequests: error.overlappingRequests,
                overlappingRequestHash: error.overlappingRequestHash,
                maxRetries: error.maxRetries,
                responseTime: error.responseTime,
                timeout: error.timeout,
                url: error.url,
            });
            if (_this.getState() === constants_1.State.destroyed) {
                return;
            }
            var isResumeFromPreroll = _this.isPlayingPreroll;
            _this.isPlayingPreroll = false;
            _this.isVideoElementUsedByAds = false;
            if (_this.isPlaybackStarted) {
                // Ad pod fetch failure means we are resuming after no ads
                _this.resume({
                    isAfterAd: false,
                    isFromPreroll: isResumeFromPreroll,
                    startLoadType: (0, tools_1.getStartLoadType)(isResumeFromPreroll, 'resumeAfterNoAds'),
                });
            }
            else {
                // Ad pod fetch failure means we are resuming after no ads
                var startLoadEventData = {
                    isResumeFromAd: false,
                    isResumeFromPreroll: isResumeFromPreroll,
                    startLoadType: (0, tools_1.getStartLoadType)(isResumeFromPreroll, 'resumeAfterNoAds'),
                };
                _this.emit(constants_1.PLAYER_EVENTS.startLoad, startLoadEventData);
                _this.load(_this.mediaUrl, _this.getPosition(), startLoadEventData);
            }
        });
    };
    Html5Adapter.prototype.removePreloadAdPlayer = function () {
        if (this.preloadAdPlayer) {
            this.preloadAdPlayer.remove();
            this.preloadAdPlayer = undefined;
        }
    };
    Html5Adapter.prototype.preloadAdResponse = function (adResponse) {
        if (this.getState() === constants_1.State.destroyed)
            return;
        this.removePreloadAdPlayer();
        if (adResponse === undefined || adResponse.length === 0) {
            return;
        }
        var experimentalConfig = this.getExperimentalConfig();
        if (experimentalConfig.preloadAds) {
            var preloadAdPlayer = this.getAdPlayer(adResponse, this.getAdPlayerOptions());
            if (preloadAdPlayer instanceof hlsAdPlayer_1.default) {
                this.preloadAdPlayer = preloadAdPlayer;
                this.preloadAdPlayer.preload(adResponse[0].video);
            }
            return;
        }
        // Preload native ads for midroll when preloadNativeAds is enabled
        if (experimentalConfig.preloadNativeAds && experimentalConfig.enableNativeAdPlayerBridge) {
            var preloadAdPlayer = this.getAdPlayer(adResponse, this.getAdPlayerOptions());
            if (preloadAdPlayer instanceof nativeAdPlayer_1.default) {
                this.preloadAdPlayer = preloadAdPlayer;
                preloadAdPlayer.preloadAdResponse(adResponse);
            }
        }
    };
    Html5Adapter.prototype.setMediaUrl = function (mediaUrl_1) {
        return tslib_1.__awaiter(this, arguments, void 0, function (mediaUrl, position, config) {
            var _a, enableHlsCacheFragments, enableCacheFragmentsBroadenRange, enableHlsDetachDuringAds, enableSeekWithResumePosition, _b, debugLevel, cuePoints, enableWorker, startLoadEventData;
            if (position === void 0) { position = 0; }
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!this.isAd() || !this.config.reuseVideoElement) {
                            this.updateFramesData(); // need to record the content frames data before video element resets media url
                        }
                        if (this.config.experimentalConfig) {
                            if (config.hasOwnProperty('enableHlsDetachDuringAds')) {
                                this.config.experimentalConfig.enableHlsDetachDuringAds = config.enableHlsDetachDuringAds;
                            }
                            if (config.hasOwnProperty('enableSeekWithResumePosition')) {
                                this.config.experimentalConfig.enableSeekWithResumePosition = config.enableSeekWithResumePosition;
                            }
                            if (config.hasOwnProperty('customPlaybackHandlers')) {
                                this.config.experimentalConfig.customPlaybackHandlers = config.customPlaybackHandlers;
                            }
                        }
                        _a = this.getExperimentalConfig(), enableHlsCacheFragments = _a.enableHlsCacheFragments, enableCacheFragmentsBroadenRange = _a.enableCacheFragmentsBroadenRange, enableHlsDetachDuringAds = _a.enableHlsDetachDuringAds, enableSeekWithResumePosition = _a.enableSeekWithResumePosition;
                        if (enableHlsCacheFragments) {
                            _b = this.config, debugLevel = _b.debugLevel, cuePoints = _b.cuePoints;
                            enableWorker = (0, config_1.buildHlsConfig)(this.config).enableWorker;
                            hlsFragmentCache_1.HlsFragmentCache.getInstance().init({
                                isDebug: !!(0, tools_1.isPlayerDebugEnabled)(debugLevel),
                                maxFragmentsCacheDurationAfterCuePoint: enableHlsCacheFragments,
                                cuePoints: cuePoints,
                                isCacheInitSegment: !enableHlsDetachDuringAds,
                                cacheFragmentsNearPositionZero: !!enableSeekWithResumePosition,
                                appendCallback: this.onFragBeforeCuePointMayCache,
                                getContentPosition: this.getPosition.bind(this),
                                enableWorker: enableWorker,
                                enableCacheFragmentsBroadenRange: enableCacheFragmentsBroadenRange,
                            });
                        }
                        return [4 /*yield*/, this.destroyExtension()];
                    case 1:
                        _c.sent();
                        this.config.drmKeySystem = config.drmKeySystem;
                        this.config.licenseUrl = config.licenseUrl;
                        this.config.hdcpVersion = config.hdcpVersion;
                        this.config.serverCertificateUrl = config.serverCertificateUrl;
                        if ((0, types_1.isHlsExtensionConfig)(this.config.extensionConfig) && config.hasOwnProperty('drmSystemOptions')) {
                            this.config.extensionConfig.hls.drmSystemOptions = config.drmSystemOptions;
                        }
                        this.mediaUrl = mediaUrl;
                        if (!this.isAd()) {
                            startLoadEventData = {
                                isResumeFromAd: false,
                                isResumeFromPreroll: false,
                                startLoadType: 'retry',
                            };
                            this.load(mediaUrl, position, startLoadEventData);
                        }
                        return [2 /*return*/, Promise.resolve()];
                }
            });
        });
    };
    /**
     * Play each AdPod in the ad response
     * @param adResponse a list of AdPod
     */
    Html5Adapter.prototype.playAdResponse = function (adResponse, config) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, metrics, requestPosition, isFromPreroll, reuseVideoElement, _b, enableHlsDetachDuringAds, enableNativeAdPlayerBridge, enableCacheFragmentsBroadenRange, exception_1;
            var _c;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.log('playAdResponse', adResponse);
                        if (this.getState() === constants_1.State.destroyed)
                            return [2 /*return*/];
                        _a = config || {}, metrics = _a.metrics, requestPosition = _a.requestPosition;
                        this.destroyPerformanceCollector();
                        // Handle empty ad response
                        if (adResponse.length === 0) {
                            this.emit(constants_1.PLAYER_EVENTS.adPodEmpty, {
                                isPreroll: this.isPlayingPreroll,
                            });
                            isFromPreroll = this.isPlayingPreroll;
                            this.isPlayingPreroll = false;
                            // empty ad pod means we are resuming after no ads
                            this.resume({
                                isAfterAd: false,
                                isFromPreroll: isFromPreroll,
                                startLoadType: (0, tools_1.getStartLoadType)(isFromPreroll, 'resumeAfterNoAds'),
                            });
                            return [2 /*return*/];
                        }
                        this.emit(constants_1.PLAYER_EVENTS.adResponse, {
                            response: adResponse,
                            isPreroll: this.isPreroll(),
                            requestPosition: requestPosition,
                            metrics: metrics,
                        });
                        this.pause();
                        reuseVideoElement = this.config.reuseVideoElement;
                        _b = this.getExperimentalConfig(), enableHlsDetachDuringAds = _b.enableHlsDetachDuringAds, enableNativeAdPlayerBridge = _b.enableNativeAdPlayerBridge, enableCacheFragmentsBroadenRange = _b.enableCacheFragmentsBroadenRange;
                        this.removeVideoElementEvents();
                        if (!(reuseVideoElement && !enableNativeAdPlayerBridge)) return [3 /*break*/, 7];
                        this.updateFramesData(); // need to record the content frames data before video element is switched to playing ad
                        // Because we removed the pause event listener when start to play mid-roll ads. So we need to sync the `paused` state
                        this.syncPauseState();
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 5, , 6]);
                        if (!(enableHlsDetachDuringAds && this.extension)) return [3 /*break*/, 2];
                        // @TODO update the method name for better reading
                        if ((_c = this.extension.getHlsInstance()) === null || _c === void 0 ? void 0 : _c.media) {
                            this.extension.detachMedia();
                            if (this.getExperimentalConfig().enableHlsCacheFragments && !enableCacheFragmentsBroadenRange) {
                                // Fragments which pts is before currentTime will not likely be reused,
                                // so we can reduce cache fragments before ads playback to decrease memory usage
                                hlsFragmentCache_1.HlsFragmentCache.getInstance().reduceFragmentCacheByCurrentTime(this.contentPosition);
                            }
                        }
                        return [3 /*break*/, 4];
                    case 2:
                        this.updateFragDownloadStats();
                        this.updateAbrLoggingData();
                        return [4 /*yield*/, this.destroyExtension()];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        exception_1 = _d.sent();
                        this.log(exception_1, 'Error while destroying extension before cue point.');
                        return [3 /*break*/, 6];
                    case 6:
                        this.isVideoElementUsedByAds = true;
                        return [3 /*break*/, 8];
                    case 7:
                        if (!enableNativeAdPlayerBridge) {
                            this.videoElement.style.visibility = 'hidden';
                        }
                        if (this.getExperimentalConfig().pauseContentDownloadDuringAds) {
                            this.pauseDownloadingSegments();
                        }
                        _d.label = 8;
                    case 8:
                        this.setupAdPlayer(adResponse);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the current selected captions index
     */
    Html5Adapter.prototype.getCaptions = function () {
        return this.captionsIndex;
    };
    /**
     * Set selected captions index
     * @param index new selected captions index
     */
    Html5Adapter.prototype.setCaptions = function (index) {
        var _this = this;
        this.log('setCaptions', index, this.captionsIndex);
        if (this.captionsIndex === index || this.captionsList[index] === undefined)
            return;
        var experimentalConfig = this.getExperimentalConfig();
        this.captionsIndex = index;
        this.captionsUnits = [];
        this.emit(constants_1.PLAYER_EVENTS.captionsChange, { captionsIndex: this.captionsIndex });
        if (this.captionsIndex === 0) {
            if (this.captionsWindowElement) {
                this.captionsWindowElement.innerHTML = '';
            }
            this.hideCaptions();
            return;
        }
        var currentCaptions = this.captionsList[this.captionsIndex];
        (0, captions_1.fetchData)(currentCaptions.id, experimentalConfig.useNativeCpationsCache)
            .then(function (data) {
            _this.captionsUnits = data;
            /* istanbul ignore else */
            if (!_this.isAd()) {
                _this.showCaptions();
            }
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
    Object.defineProperty(Html5Adapter.prototype, "captionsList", {
        get: function () {
            if (this._captionsList.length === 0) {
                return [];
            }
            return tslib_1.__spreadArray([constants_1.FROZEN_CAPTIONS_OFF], this._captionsList, true);
        },
        enumerable: false,
        configurable: true
    });
    /**
     * Get all available captions list
     */
    Html5Adapter.prototype.getCaptionsList = function () {
        return this.captionsList;
    };
    /**
     * Set captions list
     * @param captionsList a list of Captions, without the default `off` option
     */
    Html5Adapter.prototype.setCaptionsList = function (captionsList) {
        this._captionsList = captionsList;
        // if no valid captions, return without adding a unnecessary `off` option
        if (captionsList.length === 0)
            return;
        this.emit(constants_1.PLAYER_EVENTS.captionsListChange, { captionsList: this.captionsList });
        this.emit(constants_1.PLAYER_EVENTS.allCaptionsAvailable, { captionsList: this.captionsList });
    };
    /**
     * Get mute state
     */
    Html5Adapter.prototype.getMute = function () {
        return this.videoElement.muted;
    };
    /**
     * Set mute state
     * @param mute new mute state
     */
    Html5Adapter.prototype.setMute = function (mute) {
        this.videoElement.muted = mute;
    };
    /**
     * Get volume setting, 0~100
     */
    Html5Adapter.prototype.getVolume = function () {
        return Math.floor(this.videoElement.volume * 100);
    };
    /**
     * Set volume
     * @param volume new volume, 0~100
     */
    Html5Adapter.prototype.setVolume = function (volume) {
        this.videoElement.volume = volume / 100;
    };
    Html5Adapter.prototype.getResourcesRealhost = function () {
        if (this.extension) {
            return this.extension.getResourcesRealhost();
        }
        return Promise.resolve('');
    };
    /**
     * get the current rendition, e.g. '1280x720'
     */
    Html5Adapter.prototype.getRendition = function () {
        var rendition = '';
        if (this.extension) {
            rendition = this.extension.getRendition();
        }
        if (!rendition) {
            rendition = (0, tools_1.buildRenditionString)({ width: this.videoElement.videoWidth, height: this.videoElement.videoHeight });
        }
        return rendition;
    };
    Html5Adapter.prototype.getTotalDroppedFrames = function () {
        if (this.extension) {
            return this.extension.getTotalDroppedFrames();
        }
        return -1;
    };
    Html5Adapter.prototype.getFrameInfo = function () {
        if (this.extension) {
            return this.extension.fetchAndResetFrameInfo();
        }
        return [];
    };
    Html5Adapter.prototype.getRenditionInfo = function () {
        if (this.extension) {
            return this.extension.fetchAndResetRenditionInfo();
        }
        return [];
    };
    Html5Adapter.prototype.getQualityLevel = function () {
        if (this.extension) {
            return this.extension.getQualityLevel();
        }
    };
    Html5Adapter.prototype.getIsAdFetching = function () {
        return this.isAdFetching;
    };
    Html5Adapter.prototype.getLevels = function () {
        if (this.extension) {
            return this.extension.getLevels();
        }
        return [];
    };
    Html5Adapter.prototype.getRestrictedLevels = function () {
        if (!this.extension)
            return [];
        return this.extension.getRestrictedLevels();
    };
    /**
     * Is the adapter using a web worker to transmux segments?
     */
    Html5Adapter.prototype.getIsUsingWebWorker = function () {
        return !!this.extension && this.extension.getIsUsingWebWorker();
    };
    Html5Adapter.prototype.getIsBuffering = function () {
        return this.adPlayer
            ? this.adPlayer.getIsBuffering()
            : this.isContentBuffering;
    };
    Html5Adapter.prototype.recoverHlsError = function (error) {
        var _a = this.getExperimentalConfig(), enableHlsDetachDuringAds = _a.enableHlsDetachDuringAds, enableSeekWithResumePosition = _a.enableSeekWithResumePosition;
        if (this.extension) {
            var isMediaError = error.type === constants_1.ErrorType.MEDIA_ERROR;
            var isManifestLoadTimeout = error.type === constants_1.ErrorType.NETWORK_ERROR && error.details === constants_1.PLAYER_ERROR_DETAILS.MANIFEST_LOAD_TIMEOUT;
            if (!enableHlsDetachDuringAds && enableSeekWithResumePosition && (isMediaError || isManifestLoadTimeout)) {
                if (this.hlsErrorReloadMediaUrlCount < constants_1.MAX_HLS_ERROR_RELOAD_MEDIA_URL_COUNT) {
                    this.hlsErrorReloadMediaUrlCount++;
                    this.reloadMediaUrl();
                    return true;
                }
            }
            else {
                return this.extension.recoverHlsError(error);
            }
        }
        return false;
    };
    Html5Adapter.prototype.getStartupMetrics = function () {
        var _a;
        return (_a = this.performanceCollector) === null || _a === void 0 ? void 0 : _a.getRecords();
    };
    Html5Adapter.prototype.reloadMediaUrl = function () {
        var _a = this.config, drmKeySystem = _a.drmKeySystem, licenseUrl = _a.licenseUrl, serverCertificateUrl = _a.serverCertificateUrl, hdcpVersion = _a.hdcpVersion;
        this.emit(constants_1.PLAYER_EVENTS.reload);
        this.setMediaUrl(this.mediaUrl, this.getPrecisePosition(), {
            drmKeySystem: drmKeySystem,
            licenseUrl: licenseUrl,
            serverCertificateUrl: serverCertificateUrl,
            hdcpVersion: hdcpVersion,
        });
    };
    Html5Adapter.prototype.forceRecoverHlsError = function () {
        var _a = this.getExperimentalConfig(), enableHlsDetachDuringAds = _a.enableHlsDetachDuringAds, enableSeekWithResumePosition = _a.enableSeekWithResumePosition;
        if (this.extension) {
            if (!enableHlsDetachDuringAds && enableSeekWithResumePosition) {
                this.reloadMediaUrl();
            }
            else {
                this.extension.forceRecoverHlsMediaError();
            }
        }
    };
    Html5Adapter.prototype.attachVideoElementEvents = function () {
        var _this = this;
        var listeners = [
            ['loadedmetadata', this.onLoadedMetadata],
            ['loadeddata', this.onLoadedData],
            ['loadstart', this.onLoadStart],
            ['waiting', this.onWaiting],
            ['canplay', this.onCanPlay],
            ['playing', this.onPlaying],
            ['play', this.onPlay],
            ['pause', this.onPause],
            ['seeking', this.onSeeking],
            ['seeked', this.onVideoElementSeeked],
            ['timeupdate', this.onTimeupdate],
            ['ended', this.onEnded],
            ['error', this.onVideoElementError],
            ['durationchange', this.onDurationChange],
        ];
        listeners.forEach(function (listener) {
            _this.videoElement.addEventListener(listener[0], listener[1]);
        });
        var shouldReportBufferChange = (this.config.extensionConfig || {}).shouldReportBufferChange;
        var bufferReportInterval;
        if (shouldReportBufferChange) {
            bufferReportInterval = setInterval(this.bufferEventHandler, constants_1.PLAYER_BUFFER_CHANGE_EMIT_INTERVAL);
        }
        return function () {
            listeners.forEach(function (listener) {
                _this.videoElement.removeEventListener(listener[0], listener[1]);
            });
            if (bufferReportInterval) {
                clearInterval(bufferReportInterval);
            }
        };
    };
    Html5Adapter.prototype.isBufferLevelAchieved = function (threshold) {
        var _a;
        var bufferLen = this.getBufferedLength((_a = this.getHlsInstanceConfig()) === null || _a === void 0 ? void 0 : _a.maxBufferHole);
        return !threshold || bufferLen >= threshold || bufferLen >= this.contentDuration - this.videoElement.currentTime - EXIT_BUFFER_LEVEL_BUFFER_MARGIN;
    };
    Html5Adapter.prototype.tryStartupBufferLevel = function () {
        var _this = this;
        var startupEndBufferLevel = this.getExperimentalConfig().startupEndBufferLevel;
        if (startupEndBufferLevel) {
            this.cleanExitBufferLevelTimer();
            this.exitBufferLevelTimer = setTimeout(function () {
                _this.cleanExitBufferLevelTimer();
            }, MAX_STARTUP_END_EXIT_BUFFER_LEVEL_TIME);
            this.pendingForBufferLevel(); // Pause the video element to wait more data
        }
    };
    Html5Adapter.prototype.cleanExitBufferLevelTimer = function () {
        var _a = this.getExperimentalConfig(), startupEndBufferLevel = _a.startupEndBufferLevel, rebufferingEndBufferLevel = _a.rebufferingEndBufferLevel;
        if (!startupEndBufferLevel && !rebufferingEndBufferLevel) {
            return;
        }
        clearTimeout(this.exitBufferLevelTimer);
        this.exitBufferLevelTimer = undefined;
        this.exitPendingForBufferLevel();
    };
    Html5Adapter.prototype.pendingForBufferLevel = function () {
        var _a = this.getExperimentalConfig(), startupEndBufferLevel = _a.startupEndBufferLevel, rebufferingEndBufferLevel = _a.rebufferingEndBufferLevel;
        if (!startupEndBufferLevel && !rebufferingEndBufferLevel) {
            return;
        }
        this.videoElement.playbackRate = 0;
    };
    Html5Adapter.prototype.exitPendingForBufferLevel = function () {
        this.videoElement.playbackRate = 1;
    };
    Html5Adapter.prototype.isPendingForBufferLevel = function () {
        return !!this.exitBufferLevelTimer && this.videoElement.playbackRate === 0;
    };
    Html5Adapter.prototype.getVideoErrorEventData = function (error) {
        /**
         * The event listener will throw an event on the video element.
         * That's useless for us.
         * We should get the error attribute instead.
         */
        var err = error && !(error instanceof Event)
            ? error
            : this.videoElement.error;
        this.log('onError', err);
        var _a = this.config, nativeErrorTransformer = _a.nativeErrorTransformer, licenseUrl = _a.licenseUrl, hdcpVersion = _a.hdcpVersion;
        var code = err === null || err === void 0 ? void 0 : err.code;
        var isDrmHdcp = !!licenseUrl && !!hdcpVersion && hdcpVersion !== 'hdcp_disabled';
        return (nativeErrorTransformer === null || nativeErrorTransformer === void 0 ? void 0 : nativeErrorTransformer(err, this.videoElement, isDrmHdcp)) || {
            type: constants_1.ErrorType.MEDIA_ERROR,
            /* istanbul ignore next */
            code: code,
            /* istanbul ignore next */
            message: err === null || err === void 0 ? void 0 : err.message,
            fatal: (0, tools_1.isFatalNativeError)(code),
            error: err,
            errorSource: constants_1.ERROR_SOURCE.NATIVE_ERROR,
        };
    };
    Html5Adapter.prototype.destroyPerformanceCollector = function () {
        var _a;
        (_a = this.performanceCollector) === null || _a === void 0 ? void 0 : _a.destroy();
        delete this.performanceCollector;
    };
    Html5Adapter.prototype.setState = function (state) {
        this.state = state;
    };
    Html5Adapter.prototype.syncPauseState = function () {
        this.setState(constants_1.State.paused);
        this.stopBuffering(constants_1.StopBufferingReason.el_pause_event);
    };
    Html5Adapter.prototype.startBuffering = function (reason) {
        var _a, _b;
        if (this.isContentBuffering)
            return;
        var currentTime = this.videoElement.currentTime;
        var bufferedRange = this.getBufferedRange() || [];
        var bufferingType = reason === 'el_waiting_event' && this.hasEnoughBufferToPlay() ? 'unknown' : 'network';
        var bufferedInfo = (0, tools_1.getBufferedInfo)(bufferedRange, currentTime, 0);
        var bufferHoleMaySkip = reason === 'el_waiting_event' && bufferedInfo.bufferHole !== undefined && bufferedInfo.bufferHole <= constants_1.MAX_BUFFER_HOLE_TO_SKIP;
        this.isContentBuffering = true;
        this.emit(constants_1.PLAYER_EVENTS.bufferStart, {
            reason: reason,
            currentTime: currentTime,
            bufferingType: bufferingType,
            decodedFrames: this.getDecodedFrames(),
            bufferHoleMaySkip: bufferHoleMaySkip,
        });
        if (bufferHoleMaySkip && this.getExperimentalConfig().skipBufferHoleInAdvance) {
            this.videoElement.currentTime = currentTime + bufferedInfo.bufferHole + /* istanbul ignore next: safety check only */ ((_b = (_a = this.getHlsInstanceConfig()) === null || _a === void 0 ? void 0 : _a.nudgeOffset) !== null && _b !== void 0 ? _b : 0.1);
            this.emit(constants_1.PLAYER_EVENTS.error, {
                type: constants_1.ErrorType.MEDIA_ERROR,
                details: constants_1.PLAYER_ERROR_DETAILS.PLAYER_BUFFER_SEEK_OVER_HOLE,
                fatal: false,
                errorSource: constants_1.ERROR_SOURCE.OTHER,
            });
        }
    };
    Html5Adapter.prototype.stopBuffering = function (reason) {
        var _this = this;
        if (!this.isContentBuffering)
            return;
        var rebufferingEndBufferLevel = this.getExperimentalConfig().rebufferingEndBufferLevel;
        if (rebufferingEndBufferLevel
            && this.currentTimeProgressed // Don't consider startup scenario now
            && [constants_1.StopBufferingReason.el_canplay_event, constants_1.StopBufferingReason.el_timeupdate_event_1].includes(reason) // These 2 reasons represents the end of video element waiting
            && !this.isBufferLevelAchieved(rebufferingEndBufferLevel)) {
            this.cleanExitBufferLevelTimer();
            this.exitBufferLevelTimer = setTimeout(function () {
                _this.stopBuffering(constants_1.StopBufferingReason.rebuffering_end_buffer_level_timeout);
                _this.cleanExitBufferLevelTimer();
            }, MAX_REBUFFERING_END_EXIT_BUFFER_LEVEL_TIME);
            this.pendingForBufferLevel(); // Pause the video element to wait more data
            return;
        }
        var currentTime = this.videoElement.currentTime;
        this.isContentBuffering = false;
        this.waitingEventStartBufferingTime = -1;
        this.emit(constants_1.PLAYER_EVENTS.bufferEnd, { reason: reason, currentTime: currentTime });
    };
    Html5Adapter.prototype.resume = function (resumeConfig) {
        var _a, _b;
        var isAfterAd = resumeConfig.isAfterAd, isFromPreroll = resumeConfig.isFromPreroll, startLoadType = resumeConfig.startLoadType, forceTriggerAdDiscontinueEvent = resumeConfig.forceTriggerAdDiscontinueEvent;
        var _c = this.config, reuseVideoElement = _c.reuseVideoElement, extensionConfig = _c.extensionConfig;
        var experimentalConfig = this.getExperimentalConfig();
        this.log('resume', reuseVideoElement, this.isAd(), this.getPosition());
        if (isAfterAd) {
            this.showCaptions();
            if (forceTriggerAdDiscontinueEvent) {
                (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.beforeRemove(true);
            }
            (_b = this.adPlayer) === null || _b === void 0 ? void 0 : _b.remove();
            delete this.adPlayer;
            this.isPlayingPreroll = false;
            this.closeToLastPrerollAdsEmitted = false;
        }
        var startLoadEventData = {
            isResumeFromAd: isAfterAd,
            isResumeFromPreroll: isFromPreroll,
            startLoadType: startLoadType,
        };
        this.emit(constants_1.PLAYER_EVENTS.startLoad, startLoadEventData);
        this.currentTimeProgressed = false;
        this.resumePosition = this.contentPosition;
        if (!this.mediaUrl) {
            return;
        }
        this.addVideoElementEvents();
        if (reuseVideoElement && !experimentalConfig.enableNativeAdPlayerBridge) {
            if (!this.isVideoElementUsedByAds) {
                this.play();
                return;
            }
            if (this.extension && experimentalConfig.enableHlsDetachDuringAds) {
                if (this.config.performanceCollectorEnabled) {
                    this.setupPerformanceCollector(startLoadEventData);
                    var hlsInstance_1 = this.extension.getHlsInstance();
                    if (hlsInstance_1) {
                        this.performanceCollector.setHls(hlsInstance_1);
                    }
                }
                var cacheVideoLevel = hlsFragmentCache_1.HlsFragmentCache.getInstance().getCacheVideoLevel(this.getPosition());
                var hlsInstance = this.extension.getHlsInstance();
                if ((0, types_1.isHlsExtensionConfig)(extensionConfig) && hlsInstance && cacheVideoLevel !== undefined && cacheVideoLevel !== hlsInstance.nextLoadLevel) {
                    this.emit(constants_1.PLAYER_EVENTS.resumeLevelDifferentWithCacheLevel);
                    if (experimentalConfig.enableResumeUseCacheLevel) {
                        hlsInstance.nextLoadLevel = cacheVideoLevel;
                    }
                }
                if (experimentalConfig.enablePreInitExtension && !this.videoElement.autoplay) {
                    this.videoElement.autoplay = (0, isAutoStartEnabled_1.isAutoStartEnabled)(this.config);
                }
                this.extension.attachMedia();
                this.isVideoElementUsedByAds = false;
                return;
            }
            this.load(this.mediaUrl, this.getPosition(), startLoadEventData);
            this.isVideoElementUsedByAds = false;
            return;
        }
        if (experimentalConfig.pauseContentDownloadDuringAds) {
            this.resumeDownloadingSegments();
        }
        if (!experimentalConfig.enableNativeAdPlayerBridge) {
            this.videoElement.style.visibility = 'visible';
        }
        var isNeedHlsExtension = (0, types_1.isHlsExtensionConfig)(extensionConfig) && (0, tools_1.isHls)(this.mediaUrl);
        if (!this.isPlaybackStarted || (isNeedHlsExtension && !this.extension)) {
            // Load the media url if using dedicated content player and pre-roll ads finish
            this.load(this.mediaUrl, this.getPosition(), startLoadEventData);
        }
        else {
            // otherwise, directly resume the dedicated content player
            this.play();
        }
    };
    Html5Adapter.prototype.skipAdPod = function () {
        this.resume({
            isAfterAd: true,
            isFromPreroll: this.isPlayingPreroll,
            startLoadType: (0, tools_1.getStartLoadType)(this.isPlayingPreroll, 'resumeFromMidroll'),
            forceTriggerAdDiscontinueEvent: true,
        });
    };
    Html5Adapter.prototype.load = function (url, position, startLoadEventData) {
        var _this = this;
        this.loadCount++;
        this.log('load url', url, position);
        var _a = this.config, extensionConfig = _a.extensionConfig, preload = _a.preload;
        var experimentalConfig = this.getExperimentalConfig();
        if (this.config.performanceCollectorEnabled) {
            this.setupPerformanceCollector(startLoadEventData);
        }
        if (this.config.needAutoplayAttributeOnVideoElement
            || experimentalConfig.enableHlsDetachDuringAds) {
            this.videoElement.autoplay = (0, isAutoStartEnabled_1.isAutoStartEnabled)(this.config);
        }
        if (typeof preload !== 'undefined') {
            if (preload === 'force-auto') {
                this.videoElement.preload = 'auto';
                // Some browsers won't respect the auto preload attribute.
                // But they will preload the whole content under the autoplay attribute.
                // So we create a force auto mode with the autoplay attribute.
                this.videoElement.autoplay = true;
            }
            else {
                this.videoElement.preload = preload;
            }
        }
        this.removeLoadActionListener();
        this.destroyCustomPlaybackHandlers();
        this.loadActionListener = function () {
            _this.removeLoadActionListener();
            var handler = function () {
                var couldAutoStart = (0, isAutoStartEnabled_1.isAutoStartEnabled)(_this.config);
                _this.log('load loadeddata handler', couldAutoStart, _this.isPlaybackStarted);
                // Do not play ad or title automatically if `autoStart` option is `false` and playback doesn't start yet
                if (!couldAutoStart && !_this.isPlaybackStarted)
                    return;
                _this.play({
                    disableCleanExitBufferLevelTimer: true, // Run startup end buffer level logic if we enable, not trigger play by this
                });
            };
            if (position) {
                var continueWatchingWithSeek = !_this.extension || experimentalConfig.enableSeekWithResumePosition;
                var _a = _this.config.shouldWaitForSeekedEvent, shouldWaitForSeekedEvent = _a === void 0 ? true : _a;
                if (shouldWaitForSeekedEvent) {
                    _this.once(constants_1.PLAYER_EVENTS.seeked, handler);
                    _this.removeStartupListener = function () {
                        _this.removeListener(constants_1.PLAYER_EVENTS.seeked, handler);
                        _this.removeStartupListener = undefined;
                    };
                }
                else {
                    handler();
                }
                if (continueWatchingWithSeek) {
                    // use video-tag
                    _this.seek(position, 'continueWatch');
                }
            }
            else {
                handler();
            }
        };
        if (!experimentalConfig.removeLoadeddataEventToTriggerPlay) {
            this.videoElement.addEventListener('loadeddata', this.loadActionListener);
        }
        var isHlsUrl = (0, tools_1.isHls)(url);
        var mediaType = isHlsUrl ? 'application/vnd.apple.mpegurl' : 'video/mp4';
        this.videoElement.type = mediaType;
        if ((0, types_1.isHlsExtensionConfig)(extensionConfig) && isHlsUrl) {
            this.setupExtension(url, position);
            // Sony(deprecated) use this; And preview video still need this
        }
        else {
            this.sdkName = 'video-tag';
            this.videoElement.src = url;
        }
    };
    Html5Adapter.prototype.setupExtension = function (url, position, enablePreInitExtension) {
        var _this = this;
        var _a;
        if (enablePreInitExtension === void 0) { enablePreInitExtension = false; }
        var _b = this.config, debugLevel = _b.debugLevel, extensionConfig = _b.extensionConfig;
        var experimentalConfig = this.getExperimentalConfig();
        if ((0, types_1.isHlsExtensionConfig)(extensionConfig)) {
            var _c = extensionConfig.relyOnAutoplayAttribute, relyOnAutoplayAttribute = _c === void 0 ? false : _c;
            if (experimentalConfig.enableSeekWithResumePosition) {
                extensionConfig.hls.startPosition = -1;
            }
            else {
                extensionConfig.hls.startPosition = position;
            }
            var hlsConfig = {
                videoElement: this.videoElement,
                url: url,
                debug: (0, tools_1.isPlayerDebugEnabled)(debugLevel),
                hls: (0, config_1.buildHlsConfig)(this.config),
                relyOnAutoplayAttribute: relyOnAutoplayAttribute,
                autoStart: (0, isAutoStartEnabled_1.isAutoStartEnabled)(this.config),
                enablePreInitExtension: enablePreInitExtension,
                onFirstLevelLoaded: enablePreInitExtension ? function () {
                    _this.emit(constants_1.PLAYER_EVENTS.extensionReady);
                } : undefined,
                enableFrontBufferFlush: extensionConfig.enableFrontBufferFlush,
                enableHlsCacheFragments: experimentalConfig.enableHlsCacheFragments,
                abrRuleMode: experimentalConfig.abrRuleMode,
                hlsJsTickInterval: experimentalConfig.hlsJsTickInterval,
                onCreated: function (hlsInstance) {
                    var _a;
                    (_a = experimentalConfig.customPlaybackHandlers) === null || _a === void 0 ? void 0 : _a.forEach(function (CustomPlaybackHandler) {
                        _this.customPlaybackHandlers.push(new CustomPlaybackHandler(experimentalConfig, _this, hlsInstance));
                    });
                },
            };
            if (experimentalConfig.maxLevelResolution) {
                hlsConfig.maxLevelResolution = experimentalConfig.maxLevelResolution;
            }
            this.log('hlsConfig: ', hlsConfig);
            this.sdkName = 'hls.js';
            this.extension = new hlsExtension_1.default(hlsConfig, Html5Adapter.Hls);
            this.extension.on(constants_1.PLAYER_EVENTS.error, this.onExtensionError);
            this.detachExtensionEvents = this.attachExtensionEvents();
            var hlsInstance = this.extension.getHlsInstance();
            /* istanbul ignore next */
            if (hlsInstance) {
                this.emit(constants_1.PLAYER_EVENTS.hlsSetup, { hlsInstance: hlsInstance, ExternalHls: Html5Adapter.Hls });
                (_a = this.performanceCollector) === null || _a === void 0 ? void 0 : _a.setHls(hlsInstance);
            }
        }
    };
    Html5Adapter.prototype.destroyExtension = function () {
        var _this = this;
        var _a, _b;
        (_a = this.detachExtensionEvents) === null || _a === void 0 ? void 0 : _a.call(this);
        this.isDestroyingExtension = true;
        var destroying = (_b = this.extension) === null || _b === void 0 ? void 0 : _b.destroy();
        if (destroying) {
            return destroying.then(function () {
                delete _this.extension;
                _this.isDestroyingExtension = false;
            })
                .catch(function (exception) {
                _this.log(exception, 'Error while destroying extension.');
                _this.isDestroyingExtension = false;
            });
        }
        this.isDestroyingExtension = false;
    };
    Html5Adapter.prototype.setupPerformanceCollector = function (startLoadEventData) {
        var _this = this;
        if (!this.performanceCollector) {
            this.performanceCollector = new performanceCollector_1.PerformanceCollector({
                ExternalHls: Html5Adapter.Hls,
                reporter: /* istanbul ignore next */ function (/* istanbul ignore next */ metrics) { return _this.emit(constants_1.PLAYER_EVENTS.startupPerformance, {
                    isAd: false,
                    metrics: metrics,
                    isAfterAd: startLoadEventData.isResumeFromAd,
                    isFromPreroll: startLoadEventData.isResumeFromPreroll,
                }); },
                debug: (0, tools_1.isPlayerDebugEnabled)(this.config.debugLevel),
            });
            this.performanceCollector.setVideoElement(this.videoElement);
        }
        else {
            this.performanceCollector.startupRetry();
        }
    };
    Html5Adapter.prototype.showCaptions = function () {
        var _this = this;
        if (this.config.captionsStyles) {
            var _a = this.config.captionsStyles, font = _a.font, windowStyles_1 = _a.window;
            this.captionsFontStyle = (0, captions_1.convertStyleObjectToString)(font);
            Object.keys(windowStyles_1).forEach(function (styleName) {
                _this.captionsWindowElement.style[styleName] = windowStyles_1[styleName];
            });
        }
        this.captionsElement.style.display = 'block';
    };
    Html5Adapter.prototype.hideCaptions = function () {
        this.captionsElement.style.display = 'none';
    };
    Html5Adapter.prototype.updateCaptions = function () {
        if (this.captionsUnits.length === 0)
            return;
        var unit = (0, captions_1.locate)(this.getPosition(), this.captionsUnits);
        var captionsFontStyleString = this.captionsFontStyle ? " style=\"".concat(this.captionsFontStyle, "\"") : '';
        var captionsText = unit ? unit.text.map(function (line) { return "<span".concat(captionsFontStyleString, ">").concat(line, "</span>"); }).join('') : '';
        if (captionsText !== this.previousCaptionsText) {
            this.captionsWindowElement.innerHTML = captionsText;
            this.previousCaptionsText = captionsText;
        }
    };
    Html5Adapter.prototype.isVideoElementPlaying = function () {
        var videoElement = this.videoElement;
        return !!(videoElement.currentTime > 0
            && !videoElement.paused
            && !videoElement.ended
            && videoElement.readyState > 2);
    };
    /**
     * Remove the autoplay attribute to prevent interference.
     */
    Html5Adapter.prototype.recoverForceAutoPreloadAttribute = function () {
        if (this.config.preload === 'force-auto' && this.videoElement.autoplay) {
            this.videoElement.autoplay = false;
        }
    };
    Html5Adapter.prototype.getAdPlayer = function (adResponse, adPlayerOptions) {
        var _this = this;
        var AdPlayerClass;
        var experimentalConfig = this.getExperimentalConfig();
        if (adResponse.length > 0 && (0, tools_1.isHls)(adResponse[0].video)) {
            AdPlayerClass = hlsAdPlayer_1.default;
        }
        else if (experimentalConfig.enableNativeAdPlayerBridge) {
            adPlayerOptions.bridge = experimentalConfig.enableNativeAdPlayerBridge;
            adPlayerOptions.healthFailedFallback = function () {
                delete experimentalConfig.enableNativeAdPlayerBridge;
                delete adPlayerOptions.bridge;
                delete _this.adPlayer;
                _this.setupAdPlayer(adResponse);
                _this.emit(constants_1.PLAYER_EVENTS.nativeAdsFallback, {
                    errorMsg: 'healthFailed',
                    adsCount: adResponse.length,
                });
            };
            AdPlayerClass = nativeAdPlayer_1.default;
        }
        else {
            AdPlayerClass = progressiveMp4AdPlayer_1.default;
        }
        return new AdPlayerClass(adPlayerOptions);
    };
    Html5Adapter.prototype.getAdPlayerOptions = function () {
        var _a;
        var _b = this.config, reuseVideoElement = _b.reuseVideoElement, debugLevel = _b.debugLevel, performanceCollectorEnabled = _b.performanceCollectorEnabled, playerName = _b.playerName;
        var experimentalConfig = this.getExperimentalConfig();
        var adPlayerOptions = {
            container: this.adContainerElement,
            videoElement: this.videoElement,
            playerName: playerName,
            reuseVideoElement: reuseVideoElement,
            debug: (0, tools_1.isPlayerDebugEnabled)(debugLevel),
            performanceCollectorEnabled: performanceCollectorEnabled,
            isPreroll: this.isPreroll(),
            autoStart: (0, isAutoStartEnabled_1.isAutoStartEnabled)(this.config),
            adStallAtStartHandleMethod: experimentalConfig.adStallAtStartHandleMethod,
            adStallAtStartCheckTimeout: experimentalConfig.adStallAtStartCheckTimeout,
            skipAdWithHealthScore: playerName !== types_1.PlayerName.AD ? experimentalConfig.skipAdWithHealthScore : "only_error" /* AD_HEALTH_OPTIONS.CONTROL */,
            useQueueImpressions: this.config.useQueueImpressions,
            ignorePlayInterruptErrorInAd: experimentalConfig.ignorePlayInterruptErrorInAd,
            muxJS: experimentalConfig.muxJS,
            bandwidthEstimate: this.getBandwidthEstimate(),
            impressionRequirement: (_a = experimentalConfig.impressionRequirement) !== null && _a !== void 0 ? _a : 'none',
            healthScoreThreshold: experimentalConfig.healthScoreThreshold,
            onlyRespectImpressionRequirementAfterCodeSkip: !!experimentalConfig.onlyRespectImpressionRequirementAfterCodeSkip,
            disableAdStallSkipImpressionRequirement: !!experimentalConfig.disableAdStallSkipImpressionRequirement,
            loadBetweenAds: !!experimentalConfig.loadBetweenAds,
            skipAdWithHealthScoreR2: experimentalConfig.skipAdWithHealthScoreR2,
            endAdsNearEnd: experimentalConfig.endAdsNearEnd,
            maxEstimatedTimeCostMultiplier: constants_1.MAX_ESTIMATED_TIME_COST_MULTIPLIER,
            preloadAds: experimentalConfig.preloadAds,
            hlsAdsUseMp2t: experimentalConfig.hlsAdsUseMp2t,
            deferImpressionUntilActivated: experimentalConfig.deferImpressionUntilActivated,
        };
        return adPlayerOptions;
    };
    Html5Adapter.prototype.setupAdPlayer = function (adResponse) {
        if (!this.adPlayer) {
            this.emit(constants_1.PLAYER_EVENTS.adPlayerSetup, this.isPreroll());
            if (this.preloadAdPlayer) {
                this.adPlayer = this.preloadAdPlayer;
                this.preloadAdPlayer = undefined;
            }
            else {
                this.adPlayer = this.getAdPlayer(adResponse, this.getAdPlayerOptions());
            }
            this.attachAdPlayerEvents();
        }
        this.adPlayer.playAdResponse(adResponse);
    };
    Html5Adapter.prototype.attachAdPlayerEvents = function () {
        var _this = this;
        var adPlayer = this.adPlayer;
        if (!adPlayer) {
            throw new Error('You should bind the ad player instance before you try to attach ad player events.');
        }
        adPlayer.on(constants_1.PLAYER_EVENTS.adStart, function () {
            _this.hideCaptions();
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adPlay, function () {
            _this.setState(constants_1.State.playing);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adPause, function () {
            _this.setState(constants_1.State.paused);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adPodComplete, function (event) {
            var isFromPreroll = event.isPreroll;
            _this.log('Adapter adPodComplete');
            _this.emit(constants_1.PLAYER_EVENTS.adPodComplete, tslib_1.__assign({ position: _this.getPosition() }, event));
            _this.resume({
                isAfterAd: true,
                isFromPreroll: isFromPreroll,
                startLoadType: (0, tools_1.getStartLoadType)(isFromPreroll, 'resumeFromMidroll'),
            });
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adPodEmpty, function (data) {
            var isFromPreroll = data.isPreroll;
            _this.resume({
                isAfterAd: true,
                isFromPreroll: isFromPreroll,
                startLoadType: (0, tools_1.getStartLoadType)(isFromPreroll, 'resumeFromMidroll'),
            });
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adTime, function (event) {
            _this.log('Adapter adTime');
            var experimentalConfig = _this.getExperimentalConfig();
            // Check if we're close to the end of preroll ads (within 10 seconds) and it's the last ad in the pod
            var isLastPrerollAd = event.sequence === event.podcount;
            if (_this.isPreroll() && !_this.closeToLastPrerollAdsEmitted && event.position && event.duration && isLastPrerollAd) {
                var remainingTime = event.duration - event.position;
                if (remainingTime <= constants_1.AD_GOLDEN_REMAIN_DURATION_SEC && remainingTime > 0) {
                    _this.closeToLastPrerollAdsEmitted = true;
                    _this.emit(constants_1.PLAYER_EVENTS.closeToLastPrerollAds);
                    if ((experimentalConfig === null || experimentalConfig === void 0 ? void 0 : experimentalConfig.enablePreInitExtension) && !_this.isExtensionPreInited) {
                        _this.setupExtension(_this.mediaUrl, _this.getPosition(), true);
                        _this.isExtensionPreInited = true;
                    }
                }
            }
        });
        this.setupProxyAdPlayerEvents(adPlayer, this.log.bind(this));
    };
    Html5Adapter.prototype.attachExtensionEvents = function () {
        var _this = this;
        var _a;
        /* istanbul ignore next */
        (_a = this.detachExtensionEvents) === null || _a === void 0 ? void 0 : _a.call(this);
        var listeners = [
            [constants_1.PLAYER_EVENTS.qualityListChange, this.onQualityListChange],
            [constants_1.PLAYER_EVENTS.visualQualityChange, this.onVisualQualityChange],
            [constants_1.PLAYER_EVENTS.qualityChange, this.onQualityChange],
            [constants_1.PLAYER_EVENTS.bufferDataEnough, this.onBufferDataEnough],
            [constants_1.PLAYER_EVENTS.capLevelOnFPSDrop, this.onCapLevelOnFPSDrop],
            [constants_1.PLAYER_EVENTS.audioTracksAvailable, this.onAudioTracksAvailable],
            [constants_1.PLAYER_EVENTS.reload, this.onReload],
            [constants_1.PLAYER_EVENTS.reattachVideoElement, this.onReattachVideoElement],
            [constants_1.PLAYER_EVENTS.restrictedQualityListChange, this.onRestrictedQualityListChange],
            [constants_1.PLAYER_EVENTS.fragBuffered, this.onFragBuffered],
            [constants_1.PLAYER_EVENTS.mediaAttached, this.onMediaAttached],
            [constants_1.PLAYER_EVENTS.segmentTimelineMisalignment, this.onSegmentTimelineMisalignment],
        ];
        listeners.forEach(function (listener) {
            var _a;
            (_a = _this.extension) === null || _a === void 0 ? void 0 : _a.addListener(listener[0], listener[1]);
        });
        return function () {
            listeners.forEach(function (listener) {
                var _a;
                (_a = _this.extension) === null || _a === void 0 ? void 0 : _a.removeListener(listener[0], listener[1]);
            });
        };
    };
    Html5Adapter.prototype.updateFramesData = function () {
        var _a = (0, tools_1.getVideoPlaybackQuality)(this.videoElement), totalVideoFrames = _a.totalVideoFrames, droppedVideoFrames = _a.droppedVideoFrames;
        if (totalVideoFrames === undefined || droppedVideoFrames === undefined)
            return;
        this.decodedFrames += totalVideoFrames;
        this.droppedFrames += droppedVideoFrames;
    };
    Html5Adapter.prototype.getVideoPlaybackQuality = function () {
        var _a = (0, tools_1.getVideoPlaybackQuality)(this.videoElement), totalVideoFrames = _a.totalVideoFrames, droppedVideoFrames = _a.droppedVideoFrames;
        if (totalVideoFrames === undefined || droppedVideoFrames === undefined)
            return {};
        var plusCurrentFrames = !(this.isAd() && this.config.reuseVideoElement);
        return {
            totalVideoFrames: this.decodedFrames + (plusCurrentFrames ? totalVideoFrames : 0),
            droppedVideoFrames: this.droppedFrames + (plusCurrentFrames ? droppedVideoFrames : 0),
        };
    };
    Html5Adapter.prototype.hasEnoughBufferToPlay = function () {
        var currentTime = this.videoElement.currentTime;
        return (0, tools_1.getBufferedInfo)(this.getBufferedVideoRange(), currentTime, 0).len > constants_1.ENOUGH_BUFFER_LENGTH_TO_PLAY_THRESHOLD
            && (0, tools_1.getBufferedInfo)(this.getBufferedAudioRange(), currentTime, 0).len > constants_1.ENOUGH_BUFFER_LENGTH_TO_PLAY_THRESHOLD;
    };
    Html5Adapter.prototype.isResumePositionBuffered = function () {
        var maxTolerableGap = 1; // use a big buffer hole value `1` because we often meet big buffer data gap when checking resume buffer range
        return (0, tools_1.getBufferedInfo)(this.getBufferedVideoRange(), this.resumePosition, maxTolerableGap).len > 0
            && (0, tools_1.getBufferedInfo)(this.getBufferedAudioRange(), this.resumePosition, maxTolerableGap).len > 0;
    };
    Html5Adapter.prototype.getDecodedFrames = function () {
        return (0, tools_1.getVideoPlaybackQuality)(this.videoElement).totalVideoFrames;
    };
    Html5Adapter.prototype.getAbrLoggingData = function () {
        this.updateAbrLoggingData();
        return this.abrLoggingData;
    };
    Html5Adapter.prototype.updateAbrLoggingData = function () {
        var _this = this;
        var _a;
        var abrLoggingData = (_a = this.extension) === null || _a === void 0 ? void 0 : _a.getAbrLoggingData();
        if (!abrLoggingData)
            return;
        this.abrLoggingData.common = abrLoggingData.common;
        this.abrLoggingData.switch_info = this.abrLoggingData.switch_info.concat(abrLoggingData.switch_info);
        Object.keys(this.abrLoggingData.time_series).forEach(function (key) {
            _this.abrLoggingData.time_series[key] = _this.abrLoggingData.time_series[key].concat(abrLoggingData.time_series[key]);
        });
        this.abrLoggingData.download_speed = this.abrLoggingData.download_speed.concat(abrLoggingData.download_speed);
        this.abrLoggingData.bitrate_oscillation.total_bitrate_oscillation += abrLoggingData.bitrate_oscillation.total_bitrate_oscillation;
        this.abrLoggingData.bitrate_oscillation.played_fragments += abrLoggingData.bitrate_oscillation.played_fragments;
    };
    Html5Adapter.prototype.updateFragDownloadStats = function () {
        var _this = this;
        var _a;
        var fragDownloadStats = (_a = this.extension) === null || _a === void 0 ? void 0 : _a.getFragDownloadStats();
        if (!fragDownloadStats)
            return;
        ['video', 'audio'].forEach(function (type) {
            Object.keys(_this.fragDownloadStats[type]).forEach(function (key) {
                _this.fragDownloadStats[type][key] += fragDownloadStats[type][key];
            });
        });
    };
    Html5Adapter.prototype.detachVideoElementFromDocument = function () {
        var _a;
        var reuseVideoElement = this.config.reuseVideoElement;
        if (!reuseVideoElement) {
            return;
        }
        (_a = this.extension) === null || _a === void 0 ? void 0 : _a.detachMedia();
        (0, dom_1.removeVideoElement)(this.videoElement);
    };
    Html5Adapter.prototype.attachVideoElementToDocument = function () {
        var _a;
        var reuseVideoElement = this.config.reuseVideoElement;
        if (!reuseVideoElement || !this.html5AdapterContainerElement || !this.adContainerElement || this.html5AdapterContainerElement.contains(this.videoElement)) {
            return;
        }
        this.html5AdapterContainerElement.insertBefore(this.videoElement, this.adContainerElement);
        (_a = this.extension) === null || _a === void 0 ? void 0 : _a.attachMedia();
    };
    Html5Adapter.prototype.activateAdImpressions = function () {
        var _a;
        (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.activateImpressions();
    };
    Html5Adapter.VIDEO_COMPONENT_ID = 'videoPlayerComponent';
    Html5Adapter.AD_COMPONENT_ID = 'adComponent';
    // subtitleArea is for locating subtitle section (top/left/right)
    Html5Adapter.CAPTIONS_AREA_ID = 'subtitleAreaComponent';
    // subtitleWindow is for rendering window background, its width is decided by caption text's length
    Html5Adapter.CAPTIONS_WINDOW_ID = 'subtitleWindowComponent';
    Html5Adapter.htmlString = "\n    <div data-id=\"".concat(constants_1.PLAYER_CONTAINER_IDS.html5, "\">\n      <video data-id=\"").concat(Html5Adapter.VIDEO_COMPONENT_ID, "\"></video>\n      <div data-id=\"").concat(Html5Adapter.AD_COMPONENT_ID, "\"></div>\n      <div data-id=\"").concat(Html5Adapter.CAPTIONS_AREA_ID, "\">\n        <div data-id=\"").concat(Html5Adapter.CAPTIONS_WINDOW_ID, "\" data-test-id=\"").concat(Html5Adapter.CAPTIONS_WINDOW_ID, "\"></div>\n      </div>\n    </div>\n  ");
    Html5Adapter.loadScript = function (config) {
        if (config === void 0) { config = {}; }
        // There is nothing left to do
        // as we already have Hls defined.
        if (Html5Adapter.Hls) {
            return;
        }
        var _a = config.extensionConfig, extensionConfig = _a === void 0 ? {} : _a;
        if (!(0, types_1.isHlsExtensionConfig)(extensionConfig)) {
            return;
        }
        if (extensionConfig.externalHlsResolver) {
            return extensionConfig.externalHlsResolver.then(function (ExternalHls) {
                Html5Adapter.Hls = ExternalHls;
            });
        }
    };
    return Html5Adapter;
}(PlayerEventEmitter_1.PlayerEventEmitter));
exports.default = Html5Adapter;
//# sourceMappingURL=html5.js.map