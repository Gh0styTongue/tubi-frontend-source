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
var performanceCollector_1 = require("../utils/performanceCollector");
var PlayerEventEmitter_1 = require("../utils/PlayerEventEmitter");
var progressiveMp4AdPlayer_1 = tslib_1.__importDefault(require("../utils/progressiveMp4AdPlayer"));
var tools_1 = require("../utils/tools");
var BUFFER_TIME_THRESHOLD = 300;
/**
 * Player adapter for HTML5 video element
 * Spec: https://html.spec.whatwg.org/multipage/media.html
 */
var Html5Adapter = /** @class */ (function (_super) {
    tslib_1.__extends(Html5Adapter, _super);
    function Html5Adapter(config) {
        var _this = _super.call(this) || this;
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
        _this.checkBufferBeforeResumeStartupAfterMidroll = false;
        _this.shouldPlayWhenBufferThresholdMet = false;
        _this.customPlaybackHandlers = [];
        _this.decodedFrames = 0;
        _this.droppedFrames = 0;
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
        _this.onProgress = function () {
            if (!_this.shouldPlayWhenBufferThresholdMet)
                return;
            var threshold = _this.getExperimentalConfig().minResumeStartupBufferDataLength;
            if (_this.bufferEnoughToPlay(threshold, 0.5)) {
                _this.shouldPlayWhenBufferThresholdMet = false;
                _this.stopBuffering(constants_1.StopBufferingReason.wait_buffer_threshold_met_end); // hide spinner
                (0, dom_1.safeVideoElementPlay)(_this.videoElement, _this.onVideoElementError);
            }
        };
        _this.bufferEnoughToPlay = function (threshold, maxHoleDuration) {
            if (threshold === void 0) { threshold = 0; }
            if (maxHoleDuration === void 0) { maxHoleDuration = 0; }
            if (threshold === 0)
                return true;
            var bufferedLength = _this.getBufferedLength(maxHoleDuration);
            var result = bufferedLength >= threshold || bufferedLength === _this.contentDuration - _this.contentPosition;
            if (result) {
                _this.log("buffer enough to play with threshold: ".concat(threshold));
            }
            return result;
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
            _this.emit(constants_1.PLAYER_EVENTS.canPlay);
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
            var _a = _this.videoElement, duration = _a.duration, position = _a.currentTime;
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
            if (_this.getDuration() > 0
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
            _this.contentPosition = position;
            _this.emit(constants_1.PLAYER_EVENTS.time, {
                position: _this.getPosition(),
                duration: _this.getDuration(),
            });
            _this.updateCaptions();
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
        _this.mediaUrl = config.mediaUrl;
        _this.config = config;
        _this.playerContainerElement = config.playerContainer;
        _this.resumePosition = _this.contentPosition = config.resumePosition || 0;
        _this.log = (0, tools_1.isPlayerDebugEnabled)(config.debugLevel) ? (0, tools_1.debug)('Html5Adapter') : function () { };
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
    Html5Adapter.prototype.setup = function () {
        var _a = this.config, prerollUrl = _a.prerollUrl, experimentalConfig = _a.experimentalConfig;
        this.detachVideoElementEvents = this.attachVideoElementEvents();
        if (prerollUrl) {
            this.isPlayingPreroll = true;
            // If we try to play prerollUrl, that means we have no time to set up the video element for the content. So we can consider the video element has been used by ads no matter if it has ads.
            this.isVideoElementUsedByAds = true;
            this.playAdTag(prerollUrl);
            if ((experimentalConfig === null || experimentalConfig === void 0 ? void 0 : experimentalConfig.enablePreInitExtension) && !this.isExtensionPreInited) {
                this.setupExtension(this.mediaUrl, this.getPosition());
                this.isExtensionPreInited = true;
            }
        }
        else {
            if (!this.mediaUrl) {
                if (this.config.playerName === types_1.PlayerName.AD) {
                    return;
                }
                throw new Error('No media url provided');
            }
            var resumeFromAdData = {
                isResumeFromAd: false,
                isResumeFromPreroll: false,
            };
            this.emit(constants_1.PLAYER_EVENTS.startLoad, resumeFromAdData);
            this.currentTimeProgressed = false;
            this.load(this.mediaUrl, this.getPosition(), resumeFromAdData);
        }
    };
    Html5Adapter.prototype.reload = function (_a) {
        var position = _a.position, skipPreroll = _a.skipPreroll;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.clean()];
                    case 1:
                        _b.sent();
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
        this.load(url, 0, {
            isResumeFromAd: false,
            isResumeFromPreroll: false,
        });
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
        return (0, tools_1.transBufferedRangesIntoArray)(buffered);
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
        return (0, tools_1.getBufferedInfo)(this.getBufferedRange(), position, maxHoleDuration).len;
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
        return (0, tools_1.isTimeInBufferedRange)(position, bufferedVideoRange.length === 0 && this.state === constants_1.State.destroyed ? this.getBufferedRange() : bufferedVideoRange);
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
        return (0, tools_1.isTimeInBufferedRange)(position, bufferedAudioRange.length === 0 && this.state === constants_1.State.destroyed ? this.getBufferedRange() : bufferedAudioRange);
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
     * Get the current playback duration, in seconds
     */
    Html5Adapter.prototype.getDuration = function () {
        return this.contentDuration;
    };
    /**
     * Get the current playback bitrate, in bits/s
     */
    Html5Adapter.prototype.getBitrate = function () {
        var _a, _b;
        return (_b = (_a = this.extension) === null || _a === void 0 ? void 0 : _a.getBitrate()) !== null && _b !== void 0 ? _b : -1;
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
        var _a;
        return (_a = this.extension) === null || _a === void 0 ? void 0 : _a.getFragDownloadStats();
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
    Html5Adapter.prototype.play = function () {
        var _a;
        var isAd = this.isAd();
        this.log('play', isAd, this.isPlaybackStarted);
        if (isAd) {
            (_a = this.adPlayer) === null || _a === void 0 ? void 0 : _a.play();
            return;
        }
        if (this.checkBufferBeforeResumeStartupAfterMidroll) {
            this.checkBufferBeforeResumeStartupAfterMidroll = false;
            var threshold = this.getExperimentalConfig().minResumeStartupBufferDataLength;
            if (this.bufferEnoughToPlay(threshold, 0.5)) {
                (0, dom_1.safeVideoElementPlay)(this.videoElement, this.onVideoElementError);
            }
            else {
                this.shouldPlayWhenBufferThresholdMet = true;
                this.onPause(); // we need to sync `pause` state with ui layer
                this.startBuffering(constants_1.StartBufferingReason.wait_buffer_threshold_met_start); // show spinner
            }
            return;
        }
        if (this.shouldPlayWhenBufferThresholdMet) {
            this.shouldPlayWhenBufferThresholdMet = false;
            this.stopBuffering(constants_1.StopBufferingReason.wait_buffer_threshold_met_end); // hide spinner
        }
        (0, dom_1.safeVideoElementPlay)(this.videoElement, this.onVideoElementError);
    };
    /**
     * Pause the playback
     */
    Html5Adapter.prototype.pause = function () {
        var _a;
        var isAd = this.isAd();
        this.log('pause', isAd);
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
        if (this.isAdFetching || this.isAd())
            return;
        this.emit(constants_1.PLAYER_EVENTS.seek, {
            position: this.getPosition(),
            offset: position,
            seekActionType: seekActionType,
        });
        this.videoElement.currentTime = position;
        if (this.shouldPlayWhenBufferThresholdMet) {
            this.shouldPlayWhenBufferThresholdMet = false;
            this.play();
        }
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
    };
    // Clean all event listeners and destroy all extensions / montiors/ ad players
    // This method can be used to reset player state with out destroy it, especially when we want to reload the content
    Html5Adapter.prototype.clean = function () {
        var _a, _b, _c;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        this.removeLoadActionListener();
                        (_a = this.removeStartupListener) === null || _a === void 0 ? void 0 : _a.call(this);
                        this.destroyPerformanceCollector();
                        (_b = this.adPlayer) === null || _b === void 0 ? void 0 : _b.remove();
                        return [4 /*yield*/, this.destroyExtension()];
                    case 1:
                        _d.sent();
                        this.destroyCustomPlaybackHandlers();
                        (_c = this.detachVideoElementEvents) === null || _c === void 0 ? void 0 : _c.call(this);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Destruct player
     */
    Html5Adapter.prototype.remove = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log('remove');
                        if (this.state === constants_1.State.destroyed) {
                            return [2 /*return*/];
                        }
                        this.setState(constants_1.State.destroyed);
                        return [4 /*yield*/, this.clean()];
                    case 1:
                        _a.sent();
                        (0, dom_1.removeVideoElement)(this.videoElement);
                        return [2 /*return*/];
                }
            });
        });
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
            reason: constants_1.VAST_AD_NOT_USED.EXIT_PRE_POD,
        });
    };
    /**
     * Fetch ad tag and then play it if valid
     * @param adTagUrl ad tag
     */
    Html5Adapter.prototype.playAdTag = function (adTagUrl) {
        var _this = this;
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
        (0, adTools_1.fetchJsonAds)(adTagUrl, {
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
            _this.playAdResponse(ads, metrics, requestPosition);
        }, function (error) {
            _this.isAdFetching = false;
            _this.emit(constants_1.PLAYER_EVENTS.adPodFetchError, {
                isPreroll: _this.isPlayingPreroll,
                message: error === null || error === void 0 ? void 0 : error.message,
                retries: error === null || error === void 0 ? void 0 : error.retries,
                overlappingRequests: error === null || error === void 0 ? void 0 : error.overlappingRequests,
                overlappingRequestHash: error === null || error === void 0 ? void 0 : error.overlappingRequestHash,
            });
            var isResumeFromPreroll = _this.isPlayingPreroll;
            _this.isPlayingPreroll = false;
            _this.isVideoElementUsedByAds = false;
            if (_this.isPlaybackStarted) {
                // Ad pod fetch failure means we are resuming after no ads
                _this.resume(false, isResumeFromPreroll);
            }
            else {
                // Ad pod fetch failure means we are resuming after no ads
                var resumeFromAdData = {
                    isResumeFromAd: false,
                    isResumeFromPreroll: isResumeFromPreroll,
                };
                _this.emit(constants_1.PLAYER_EVENTS.startLoad, resumeFromAdData);
                _this.load(_this.mediaUrl, _this.getPosition(), resumeFromAdData);
            }
        });
    };
    Html5Adapter.prototype.hideVideoElementIfNotReuseVideoElement = function () {
        if (!this.config.reuseVideoElement) {
            this.videoElement.style.visibility = 'hidden';
        }
    };
    Html5Adapter.prototype.preloadAdResponse = function (adResponse, cuePoint, isPreroll) {
        if (isPreroll === void 0) { isPreroll = false; }
        if (this.getState() === constants_1.State.destroyed)
            return;
        // Handle empty ad response
        if (adResponse.length === 0) {
            this.emit(constants_1.PLAYER_EVENTS.adPodEmpty, {
                isPreroll: isPreroll,
            });
            return;
        }
        this.emit(constants_1.PLAYER_EVENTS.adResponse, {
            response: adResponse,
            isPreroll: isPreroll,
        });
    };
    Html5Adapter.prototype.setMediaUrl = function (mediaUrl, position, config) {
        if (position === void 0) { position = 0; }
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isAd() || !this.config.reuseVideoElement) {
                            this.updateFramesData(); // need to record the content frames data before video element resets media url
                        }
                        return [4 /*yield*/, this.destroyExtension()];
                    case 1:
                        _a.sent();
                        this.config.drmKeySystem = config.drmKeySystem;
                        this.config.licenseUrl = config.licenseUrl;
                        this.config.hdcpVersion = config.hdcpVersion;
                        this.config.serverCertificateUrl = config.serverCertificateUrl;
                        if ((0, types_1.isHlsExtensionConfig)(this.config.extensionConfig) && config.hasOwnProperty('drmSystemOptions')) {
                            this.config.extensionConfig.hls.drmSystemOptions = config.drmSystemOptions;
                        }
                        // @TODO we may handle more experiment config or extension config update as fallback. We need an more elegant way to handle this config update
                        if (this.config.experimentalConfig) {
                            if (config.hasOwnProperty('enableSeekWithResumePosition')) {
                                this.config.experimentalConfig.enableSeekWithResumePosition = config.enableSeekWithResumePosition;
                            }
                            if (config.hasOwnProperty('customPlaybackHandlers')) {
                                this.config.experimentalConfig.customPlaybackHandlers = config.customPlaybackHandlers;
                            }
                        }
                        this.mediaUrl = mediaUrl;
                        if (!this.isAd()) {
                            this.load(mediaUrl, position, {
                                isResumeFromAd: false,
                                isResumeFromPreroll: false,
                            });
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
    Html5Adapter.prototype.playAdResponse = function (adResponse, metrics, requestPosition) {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var isFromPreroll, reuseVideoElement, enableHlsDetachDuringAds, exception_1;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.log('playAdResponse', adResponse);
                        if (this.getState() === constants_1.State.destroyed)
                            return [2 /*return*/];
                        this.destroyPerformanceCollector();
                        // Handle empty ad response
                        if (adResponse.length === 0) {
                            this.emit(constants_1.PLAYER_EVENTS.adPodEmpty, {
                                isPreroll: this.isPlayingPreroll,
                            });
                            isFromPreroll = this.isPlayingPreroll;
                            this.isPlayingPreroll = false;
                            // empty ad pod means we are resuming after no ads
                            this.resume(false, isFromPreroll);
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
                        enableHlsDetachDuringAds = this.getExperimentalConfig().enableHlsDetachDuringAds;
                        if (!reuseVideoElement) return [3 /*break*/, 7];
                        this.updateFramesData(); // need to record the content frames data before video element is switched to playing ad
                        (_a = this.detachVideoElementEvents) === null || _a === void 0 ? void 0 : _a.call(this);
                        // Because we removed the pause event listener when start to play mid-roll ads. So we need to sync the `paused` state
                        this.syncPauseState();
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 5, , 6]);
                        if (!(enableHlsDetachDuringAds && this.extension)) return [3 /*break*/, 2];
                        // @TODO update the method name for better reading
                        if ((_b = this.extension.getHlsInstance()) === null || _b === void 0 ? void 0 : _b.media) {
                            this.extension.detachMedia();
                        }
                        return [3 /*break*/, 4];
                    case 2: return [4 /*yield*/, this.destroyExtension()];
                    case 3:
                        _c.sent();
                        _c.label = 4;
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        exception_1 = _c.sent();
                        this.log(exception_1, 'Error while destroying extension before cue point.');
                        return [3 /*break*/, 6];
                    case 6:
                        this.isVideoElementUsedByAds = true;
                        _c.label = 7;
                    case 7:
                        // hide the videoElement to avoid the splash when adPlayer switching resource
                        this.hideVideoElementIfNotReuseVideoElement();
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
        if (this.captionsIndex === index)
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
        (0, captions_1.fetchData)(currentCaptions.id, !!this.config.forceFetchPolyfill, experimentalConfig.useNativeCpationsCache)
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
        if (this.extension) {
            var isMediaError = error.type === constants_1.ErrorType.MEDIA_ERROR;
            var isManifestLoadTimeout = error.type === constants_1.ErrorType.NETWORK_ERROR && error.details === constants_1.PLAYER_ERROR_DETAILS.MANIFEST_LOAD_TIMEOUT;
            if ((0, tools_1.isAFTMMModel)() && (isMediaError || isManifestLoadTimeout)) {
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
        if (this.extension) {
            if ((0, tools_1.isAFTMMModel)()) {
                this.reloadMediaUrl();
            }
            else {
                this.extension.forceRecoverHlsMediaError();
            }
        }
    };
    Html5Adapter.prototype.attachVideoElementEvents = function () {
        var _this = this;
        var listenerMap = {
            loadedmetadata: this.onLoadedMetadata,
            loadeddata: this.onLoadedData,
            loadstart: this.onLoadStart,
            waiting: this.onWaiting,
            canplay: this.onCanPlay,
            playing: this.onPlaying,
            play: this.onPlay,
            pause: this.onPause,
            seeking: this.onSeeking,
            seeked: this.onSeeked,
            timeupdate: this.onTimeupdate,
            ended: this.onEnded,
            error: this.onVideoElementError,
            durationchange: this.onDurationChange,
        };
        if (this.getExperimentalConfig().minResumeStartupBufferDataLength) {
            listenerMap.progress = this.onProgress;
        }
        Object.keys(listenerMap).forEach(function (eventName) {
            _this.videoElement.addEventListener(eventName, listenerMap[eventName]);
        });
        var shouldReportBufferChange = (this.config.extensionConfig || {}).shouldReportBufferChange;
        var bufferReportInterval;
        if (shouldReportBufferChange) {
            bufferReportInterval = setInterval(this.bufferEventHandler, constants_1.PLAYER_BUFFER_CHANGE_EMIT_INTERVAL);
        }
        return function () {
            Object.keys(listenerMap).forEach(function (eventName) {
                _this.videoElement.removeEventListener(eventName, listenerMap[eventName]);
            });
            if (bufferReportInterval) {
                clearInterval(bufferReportInterval);
            }
        };
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
        if (this.isContentBuffering)
            return;
        var currentTime = this.videoElement.currentTime;
        this.isContentBuffering = true;
        this.emit(constants_1.PLAYER_EVENTS.bufferStart, {
            reason: reason,
            currentTime: currentTime,
        });
    };
    Html5Adapter.prototype.stopBuffering = function (reason) {
        if (!this.isContentBuffering || this.shouldPlayWhenBufferThresholdMet)
            return;
        var currentTime = this.videoElement.currentTime;
        this.isContentBuffering = false;
        this.waitingEventStartBufferingTime = -1;
        this.emit(constants_1.PLAYER_EVENTS.bufferEnd, { reason: reason, currentTime: currentTime });
    };
    Html5Adapter.prototype.resume = function (isAfterAd, isFromPreroll) {
        var _a = this.config, reuseVideoElement = _a.reuseVideoElement, extensionConfig = _a.extensionConfig;
        var experimentalConfig = this.getExperimentalConfig();
        this.log('resume', reuseVideoElement, this.isAd(), this.getPosition());
        var resumeFromAdData = {
            isResumeFromAd: isAfterAd,
            isResumeFromPreroll: isFromPreroll,
        };
        this.emit(constants_1.PLAYER_EVENTS.startLoad, resumeFromAdData);
        this.currentTimeProgressed = false;
        this.resumePosition = this.contentPosition;
        if (!this.mediaUrl) {
            return;
        }
        if (isAfterAd && !isFromPreroll && experimentalConfig.minResumeStartupBufferDataLength) { // now we only use in mid-roll resume scenario
            this.checkBufferBeforeResumeStartupAfterMidroll = true;
        }
        if (reuseVideoElement) {
            if (!this.isVideoElementUsedByAds) {
                this.play();
                return;
            }
            // Re-attach content player events and then load content media resource
            this.detachVideoElementEvents = this.attachVideoElementEvents();
            if (this.extension && experimentalConfig.enableHlsDetachDuringAds) {
                if (this.config.performanceCollectorEnabled) {
                    this.setupPerformanceCollector(resumeFromAdData);
                    var hlsInstance = this.extension.getHlsInstance();
                    if (hlsInstance) {
                        this.performanceCollector.setHls(hlsInstance);
                    }
                }
                if (experimentalConfig.enablePreInitExtension && this.isExtensionPreInited && !this.videoElement.autoplay && !experimentalConfig.minResumeStartupBufferDataLength) {
                    this.videoElement.autoplay = (0, isAutoStartEnabled_1.isAutoStartEnabled)(this.config);
                }
                this.extension.attachMedia();
                this.isVideoElementUsedByAds = false;
                if (this.checkBufferBeforeResumeStartupAfterMidroll) {
                    this.play();
                }
                return;
            }
            this.load(this.mediaUrl, this.getPosition(), resumeFromAdData);
            this.isVideoElementUsedByAds = false;
            return;
        }
        this.videoElement.style.visibility = 'visible';
        var isNeedHlsExtension = (0, types_1.isHlsExtensionConfig)(extensionConfig) && (0, tools_1.isHls)(this.mediaUrl);
        if (!this.isPlaybackStarted || (isNeedHlsExtension && !this.extension)) {
            // Load the media url if using dedicated content player and pre-roll ads finish
            this.load(this.mediaUrl, this.getPosition(), resumeFromAdData);
        }
        else {
            // otherwise, directly resume the dedicated content player
            this.play();
        }
    };
    Html5Adapter.prototype.load = function (url, position, resumeFromAdData) {
        var _this = this;
        this.log('load url', url, position);
        var _a = this.config, extensionConfig = _a.extensionConfig, preload = _a.preload;
        var experimentalConfig = this.getExperimentalConfig();
        if (this.config.performanceCollectorEnabled) {
            this.setupPerformanceCollector(resumeFromAdData);
        }
        if ((this.config.needAutoplayAttributeOnVideoElement
            || experimentalConfig.enableHlsDetachDuringAds) && !experimentalConfig.minResumeStartupBufferDataLength) {
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
                _this.play();
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
            // Sony use this; And preview video still need this
        }
        else {
            this.sdkName = 'video-tag';
            this.videoElement.src = url;
        }
    };
    Html5Adapter.prototype.setupExtension = function (url, position) {
        var _this = this;
        var _a, _b;
        var _c = this.config, debugLevel = _c.debugLevel, extensionConfig = _c.extensionConfig;
        var experimentalConfig = this.getExperimentalConfig();
        if ((0, types_1.isHlsExtensionConfig)(extensionConfig)) {
            var _d = extensionConfig.relyOnAutoplayAttribute, relyOnAutoplayAttribute = _d === void 0 ? false : _d, _e = extensionConfig.hlsInstance, instance = _e === void 0 ? undefined : _e;
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
                instance: instance,
                enablePreInitExtension: experimentalConfig.enablePreInitExtension && !this.isExtensionPreInited,
                enableFrontBufferFlush: extensionConfig.enableFrontBufferFlush,
            };
            if (experimentalConfig.maxLevelResolution) {
                hlsConfig.maxLevelResolution = experimentalConfig.maxLevelResolution;
            }
            this.log('hlsConfig: ', hlsConfig);
            this.sdkName = 'hls.js';
            this.extension = new hlsExtension_1.default(hlsConfig, Html5Adapter.Hls);
            this.extension.on(constants_1.PLAYER_EVENTS.error, this.onExtensionError);
            this.detachExtensionEvents = this.attachExtensionEvents();
            var hlsInstance_1 = this.extension.getHlsInstance();
            /* istanbul ignore next */
            if (hlsInstance_1) {
                this.emit(constants_1.PLAYER_EVENTS.hlsSetup, { hlsInstance: hlsInstance_1, ExternalHls: Html5Adapter.Hls });
                (_a = this.performanceCollector) === null || _a === void 0 ? void 0 : _a.setHls(hlsInstance_1);
            }
            if (instance && (0, types_1.isHlsExtensionConfig)(this.config.extensionConfig)) {
                // Remove preloaded hls instance once we've utilized it
                // to prevent passing a destroyed instance after midrolls complete
                delete this.config.extensionConfig.hlsInstance;
            }
            (_b = experimentalConfig.customPlaybackHandlers) === null || _b === void 0 ? void 0 : _b.forEach(function (CustomPlaybackHandler) {
                _this.customPlaybackHandlers.push(new CustomPlaybackHandler(experimentalConfig, _this, hlsInstance_1));
            });
        }
    };
    Html5Adapter.prototype.destroyExtension = function () {
        var _a, _b;
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var exception_2;
            return tslib_1.__generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        this.isDestroyingExtension = true;
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        (_a = this.detachExtensionEvents) === null || _a === void 0 ? void 0 : _a.call(this);
                        return [4 /*yield*/, ((_b = this.extension) === null || _b === void 0 ? void 0 : _b.destroy())];
                    case 2:
                        _c.sent();
                        delete this.extension;
                        return [3 /*break*/, 4];
                    case 3:
                        exception_2 = _c.sent();
                        this.log(exception_2, 'Error while destroying extension.');
                        return [3 /*break*/, 4];
                    case 4:
                        this.isDestroyingExtension = false;
                        return [2 /*return*/];
                }
            });
        });
    };
    Html5Adapter.prototype.setupPerformanceCollector = function (resumeFromAdData) {
        var _this = this;
        var isPreloaded = !!((0, types_1.isHlsExtensionConfig)(this.config.extensionConfig) && this.config.extensionConfig.hlsInstance);
        if (!this.performanceCollector) {
            this.performanceCollector = new performanceCollector_1.PerformanceCollector({
                ExternalHls: Html5Adapter.Hls,
                reporter: /* istanbul ignore next */ function (/* istanbul ignore next */ metrics) { return _this.emit(constants_1.PLAYER_EVENTS.startupPerformance, {
                    isAd: false,
                    metrics: metrics,
                    preloaded: isPreloaded,
                    isAfterAd: resumeFromAdData.isResumeFromAd,
                    isFromPreroll: resumeFromAdData.isResumeFromPreroll,
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
    Html5Adapter.prototype.setupAdPlayer = function (adResponse) {
        if (!this.adPlayer) {
            var _a = this.config, reuseVideoElement = _a.reuseVideoElement, debugLevel = _a.debugLevel, performanceCollectorEnabled = _a.performanceCollectorEnabled, playerName = _a.playerName;
            var experimentalConfig = this.getExperimentalConfig();
            this.emit(constants_1.PLAYER_EVENTS.adPlayerSetup, this.isPreroll());
            var adPlayerOptions = {
                container: this.adContainerElement,
                videoElement: this.videoElement,
                playerName: playerName,
                reuseVideoElement: reuseVideoElement,
                debug: (0, tools_1.isPlayerDebugEnabled)(debugLevel),
                performanceCollectorEnabled: performanceCollectorEnabled,
                isPreroll: this.isPreroll(),
                autoStart: (0, isAutoStartEnabled_1.isAutoStartEnabled)(this.config),
                adNoBufferMethod: experimentalConfig.adNoBufferMethod,
                adNoBufferTimeout: experimentalConfig.adNoBufferTimeout,
                skipAdWithHealthScore: playerName !== types_1.PlayerName.AD ? experimentalConfig.skipAdWithHealthScore : "only_error" /* AD_HEALTH_OPTIONS.CONTROL */,
                useQueueImpressions: this.config.useQueueImpressions,
                ignorePlayInterruptErrorInAd: experimentalConfig.ignorePlayInterruptErrorInAd,
                muxJS: experimentalConfig.muxJS,
                bandwidthEstimate: this.getBandwidthEstimate(),
            };
            this.adPlayer = adResponse.length > 0 && (0, tools_1.isHls)(adResponse[0].video) ? new hlsAdPlayer_1.default(adPlayerOptions) : new progressiveMp4AdPlayer_1.default(adPlayerOptions);
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
        var resumeContentPlayback = function (isFromPreroll) {
            _this.showCaptions();
            adPlayer.remove();
            delete _this.adPlayer;
            _this.isPlayingPreroll = false;
            _this.resume(true, isFromPreroll);
        };
        adPlayer.on(constants_1.PLAYER_EVENTS.adStart, function (data) {
            _this.log('Adapter adStart');
            _this.emit(constants_1.PLAYER_EVENTS.adStart, data);
            _this.hideCaptions();
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adBufferStart, function (data) {
            _this.log('Adapter adBufferStart');
            _this.emit(constants_1.PLAYER_EVENTS.adBufferStart, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adHealthScoreLow, function (data) {
            _this.log('Adapter adHealthScoreLow');
            _this.emit(constants_1.PLAYER_EVENTS.adHealthScoreLow, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adBufferEnd, function (data) {
            _this.log('Adapter adBufferEnd');
            _this.emit(constants_1.PLAYER_EVENTS.adBufferEnd, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adPlay, function () {
            _this.log('Adapter adPlay');
            _this.setState(constants_1.State.playing);
            _this.emit(constants_1.PLAYER_EVENTS.adPlay);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adPause, function () {
            _this.log('Adapter adPause');
            _this.setState(constants_1.State.paused);
            _this.emit(constants_1.PLAYER_EVENTS.adPause);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adComplete, function (data) {
            _this.log('Adapter adComplete');
            _this.emit(constants_1.PLAYER_EVENTS.adComplete, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adPodComplete, function (event) {
            _this.log('Adapter adPodComplete');
            _this.emit(constants_1.PLAYER_EVENTS.adPodComplete, tslib_1.__assign({ position: _this.getPosition() }, event));
            resumeContentPlayback(event.isPreroll);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adPodEmpty, function (data) {
            _this.log('Adapter adPodEmpty');
            _this.emit(constants_1.PLAYER_EVENTS.adPodEmpty, data);
            resumeContentPlayback(data.isPreroll);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adTime, function (data) {
            _this.log('Adapter adTime');
            _this.emit(constants_1.PLAYER_EVENTS.adTime, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adError, function (error, data) {
            _this.log('Adapter adError', error);
            _this.emit(constants_1.PLAYER_EVENTS.adError, error, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adDiscontinue, function (data) {
            _this.log(constants_1.PLAYER_EVENTS.adDiscontinue);
            _this.emit(constants_1.PLAYER_EVENTS.adDiscontinue, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.startupPerformance, function (data) {
            _this.emit(constants_1.PLAYER_EVENTS.startupPerformance, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adBeaconFail, function (error, data) {
            _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, error, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adIconVisible, function (data) {
            _this.emit(constants_1.PLAYER_EVENTS.adIconVisible, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adStall, function (data) {
            _this.log('Adapter adStall', data);
            _this.emit(constants_1.PLAYER_EVENTS.adStall, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adStartLoad, function () {
            _this.log('Adapter adStartLoad');
            _this.emit(constants_1.PLAYER_EVENTS.adStartLoad);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adCanPlay, function () {
            _this.log('Adapter adCanPlay');
            _this.emit(constants_1.PLAYER_EVENTS.adCanPlay);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adCurrentTimeProgressed, function () {
            _this.log('Adapter adCurrentTimeProgressed');
            _this.emit(constants_1.PLAYER_EVENTS.adCurrentTimeProgressed);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adNoBuffer, function (data) {
            _this.log("ad ".concat(data.ad, " has no buffer"));
            _this.emit(constants_1.PLAYER_EVENTS.adNoBuffer, data);
        });
        adPlayer.on(constants_1.PLAYER_EVENTS.adQuartile, function (adQuartile) {
            _this.log("ad playback reaches ".concat(adQuartile, " quartile"));
            _this.emit(constants_1.PLAYER_EVENTS.adQuartile, adQuartile);
        });
    };
    Html5Adapter.prototype.attachExtensionEvents = function () {
        var _a;
        var _this = this;
        var _b;
        /* istanbul ignore next */
        (_b = this.detachExtensionEvents) === null || _b === void 0 ? void 0 : _b.call(this);
        var listenerMap = (_a = {},
            _a[constants_1.PLAYER_EVENTS.qualityListChange] = this.onQualityListChange,
            _a[constants_1.PLAYER_EVENTS.visualQualityChange] = this.onVisualQualityChange,
            _a[constants_1.PLAYER_EVENTS.qualityChange] = this.onQualityChange,
            _a[constants_1.PLAYER_EVENTS.bufferDataEnough] = this.onBufferDataEnough,
            _a[constants_1.PLAYER_EVENTS.capLevelOnFPSDrop] = this.onCapLevelOnFPSDrop,
            _a[constants_1.PLAYER_EVENTS.audioTracksAvailable] = this.onAudioTracksAvailable,
            _a[constants_1.PLAYER_EVENTS.reload] = this.onReload,
            _a[constants_1.PLAYER_EVENTS.reattachVideoElement] = this.onReattachVideoElement,
            _a[constants_1.PLAYER_EVENTS.restrictedQualityListChange] = this.onRestrictedQualityListChange,
            _a);
        Object.keys(listenerMap).forEach(function (eventName) {
            var _a;
            (_a = _this.extension) === null || _a === void 0 ? void 0 : _a.addListener(eventName, listenerMap[eventName]);
        });
        return function () {
            Object.keys(listenerMap).forEach(function (eventName) {
                var _a;
                (_a = _this.extension) === null || _a === void 0 ? void 0 : _a.removeListener(eventName, listenerMap[eventName]);
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
    Html5Adapter.VIDEO_COMPONENT_ID = 'videoPlayerComponent';
    Html5Adapter.AD_COMPONENT_ID = 'adComponent';
    // subtitleArea is for locating subtitle section (top/left/right)
    Html5Adapter.CAPTIONS_AREA_ID = 'subtitleAreaComponent';
    // subtitleWindow is for rendering window background, its width is decided by caption text's length
    Html5Adapter.CAPTIONS_WINDOW_ID = 'subtitleWindowComponent';
    Html5Adapter.htmlString = "\n    <div data-id=\"".concat(constants_1.PLAYER_CONTAINER_IDS.html5, "\">\n      <video data-id=\"").concat(Html5Adapter.VIDEO_COMPONENT_ID, "\"></video>\n      <div data-id=\"").concat(Html5Adapter.AD_COMPONENT_ID, "\"></div>\n      <div data-id=\"").concat(Html5Adapter.CAPTIONS_AREA_ID, "\">\n        <div data-id=\"").concat(Html5Adapter.CAPTIONS_WINDOW_ID, "\" data-test-id=\"").concat(Html5Adapter.CAPTIONS_WINDOW_ID, "\"></div>\n      </div>\n    </div>\n  ");
    Html5Adapter.loadScript = function (config) {
        if (config === void 0) { config = {}; }
        var _a = config.extensionConfig, extensionConfig = _a === void 0 ? {} : _a;
        var hlsPromise;
        if (!(0, types_1.isHlsExtensionConfig)(extensionConfig)) {
            return Promise.resolve();
        }
        if (extensionConfig.externalHlsResolver) {
            hlsPromise = extensionConfig.externalHlsResolver.then(function (ExternalHls) {
                Html5Adapter.Hls = ExternalHls;
            });
        }
        return Promise.resolve(hlsPromise);
    };
    return Html5Adapter;
}(PlayerEventEmitter_1.PlayerEventEmitter));
exports.default = Html5Adapter;
//# sourceMappingURL=html5.js.map