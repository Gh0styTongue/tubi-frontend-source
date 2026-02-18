"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var time_1 = require("@adrise/utils/lib/time");
var constants_1 = require("../constants");
var error_1 = require("../constants/error");
var event_1 = require("../constants/event");
var isAutoStartEnabled_1 = require("../interceptor/isAutoStartEnabled");
var types_1 = require("../types");
var adTools = tslib_1.__importStar(require("../utils/adTools"));
var captions_1 = require("../utils/captions");
var dash_1 = require("../utils/dash");
var dom_1 = require("../utils/dom");
var fetchWrapper_1 = require("../utils/fetchWrapper");
var PlayerEventEmitter_1 = require("../utils/PlayerEventEmitter");
var tools_1 = require("../utils/tools");
/**
 * Samsung AVPlayer Wrapper, provides JWPlayer-like interfaces
 * @class
 */
var SamsungAdapter = /** @class */ (function (_super) {
    tslib_1.__extends(SamsungAdapter, _super);
    function SamsungAdapter(config) {
        var _this = _super.call(this) /* istanbul ignore next */ || this;
        _this.isReady = false;
        _this.isTerminated = false;
        _this.contentPosition = 0;
        _this.adPosition = 0;
        _this.captionStyle = null;
        _this.isPlayingAd = false;
        _this.adQueue = [];
        _this.adCount = 0;
        _this.adSequence = 0;
        _this.isBuffering = false;
        _this.captionsIndex = 0;
        _this._captionsList = [];
        _this.captionsData = [];
        _this.state = constants_1.State.idle;
        _this.audioTrackInfoArray = [];
        _this.isGetCurrentStreamInfoReliable = true;
        _this.useTrackIndexToSetAudioTrack = false;
        _this.hasEmittedAudioTracksAvailable = false;
        _this.currentTimeProgressed = false;
        _this.adCurrentTimeProgressed = false;
        _this.adStartTimestamp = 0;
        _this.adPauseDuration = 0;
        _this.isSeeking = false;
        _this.haveSuspended = false;
        _this.adStartFired = false;
        _this.isPlayingPreroll = false;
        /**
         * downloading and parsing manifest is expensive.
         * this tracks if we have tried to do this to
         * avoid doing it multiple times
         */
        _this.hasAudioTrackParseBeenRequested = false;
        _this.onBufferingStart = function () {
            _this.isBuffering = true;
            _this.log('buffering start');
            _this.emit(_this.isAd() ? event_1.PLAYER_EVENTS.adBufferStart : event_1.PLAYER_EVENTS.bufferStart, { reason: constants_1.StartBufferingReason.avplay_buffering_begin_event, currentTime: _this.getPosition() });
        };
        _this.onBufferingComplete = function () {
            _this.stopBuffering(constants_1.StopBufferingReason.avplay_buffering_complete_event);
        };
        _this.stopBuffering = function (reason) {
            _this.log('buffering complete');
            _this.isBuffering = false;
            _this.emit(_this.isAd() ? event_1.PLAYER_EVENTS.adBufferEnd : event_1.PLAYER_EVENTS.bufferEnd, { reason: reason, currentTime: _this.getPosition() });
            /* istanbul ignore else */
            if (_this.getSDKState() === 'PLAYING') {
                // force emit `play` or `adPlay` event to keep consistent with other players
                _this.emitPlayEvent();
            }
        };
        _this.onCurrentPlayTime = function (currentTime) {
            var currentTimeInSeconds = currentTime / 1000;
            var position = Math.floor(currentTimeInSeconds);
            _this.log('timeupdate:', position, ', prev pos:', _this.getPosition());
            if (_this.getSDKState() === 'PLAYING') {
                _this.setState(constants_1.State.playing);
            }
            // NOTE sometimes `onbufferingcomplete` doesn't happen, so here make sure it happen
            /* istanbul ignore else */
            if (_this.isBuffering && _this.getPosition() !== position) {
                _this.stopBuffering(constants_1.StopBufferingReason.el_timeupdate_event_1);
            }
            if (_this.isAd()) {
                if (!_this.adCurrentTimeProgressed && currentTimeInSeconds > constants_1.CURRENT_TIME_PROGRESSED_THRESHOLD) {
                    _this.adCurrentTimeProgressed = true;
                    _this.emit(event_1.PLAYER_EVENTS.adCurrentTimeProgressed, {
                        isPreroll: _this.isPreroll(),
                    });
                }
                /**
                 * Use currentTimeInSeconds for ads.
                 * This would give accurate finish time for analytics
                 */
                _this.adPosition = currentTimeInSeconds;
                _this.adTrack(position);
                _this.emit(event_1.PLAYER_EVENTS.adTime, {
                    duration: _this.currentAd.duration,
                    podcount: _this.adCount,
                    position: position,
                    sequence: _this.adSequence,
                });
            }
            else {
                if (!_this.isSeeking && !_this.currentTimeProgressed && Math.abs(position - _this.resumePosition) > constants_1.CURRENT_TIME_PROGRESSED_THRESHOLD) {
                    _this.currentTimeProgressed = true;
                    _this.emit(event_1.PLAYER_EVENTS.currentTimeProgressed);
                }
                _this.contentPosition = position;
                _this.emit(event_1.PLAYER_EVENTS.time, {
                    position: position,
                    duration: _this.getDuration(),
                });
                _this.checkCaptions(position);
                // getCurrentStreamInfo will only return data once player is ready
                // we check on current play time until getCurrentStreamInfo returns data
                if (!_this.hasEmittedAudioTracksAvailable) {
                    var audioTracks = _this.getAudioTracks();
                    if (audioTracks.length) {
                        _this.hasEmittedAudioTracksAvailable = true;
                        _this.emit(event_1.PLAYER_EVENTS.audioTracksAvailable, audioTracks);
                    }
                }
            }
        };
        _this.onDRMEvent = function (event, data) {
            // The code snippet in Samsung's API doc is not accurate.
            // https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html
            // We should use the following code exmpale instead.
            // https://github.com/SamsungDForum/PlayerAVPlayDRM/blob/205d1cec423661d2f3f49fc12a88c02456711075/PlayerAVPlayDRM/videoPlayer.js#L80
            /* istanbul ignore next */
            var eventName = (data || {}).name;
            /* istanbul ignore else */
            if (eventName === error_1.TIZEN_DRM_REQUEST) {
                var drmParam = { ResponseMessage: data.challenge };
                _this.avplayer.setDrm('PLAYREADY', 'InstallLicense', JSON.stringify(drmParam));
            }
            else if (eventName === error_1.TIZEN_DRM_ERROR) {
                _this.emit(event_1.PLAYER_EVENTS.error, tslib_1.__assign(tslib_1.__assign({}, data), { fatal: true, type: constants_1.ErrorType.DRM_ERROR, errorSource: error_1.ERROR_SOURCE.AVPLAY_ERROR }));
            }
        };
        _this.errorHandler = function (eventType) { return _this.handleError(eventType, 'onerror'); };
        _this.exceptionHandler = function (apiCall, exception) {
            if (typeof exception === 'string') {
                _this.handleError(exception, apiCall);
                return;
            }
            _this.log('exceptionHandler', apiCall, exception);
            var message = "".concat(exception === null || exception === void 0 ? void 0 : exception.message, " ").concat(apiCall);
            var code = exception === null || exception === void 0 ? void 0 : exception.name;
            if (_this.isAd()) {
                if ((exception === null || exception === void 0 ? void 0 : exception.message) !== error_1.TIZEN_PLAYER_ERROR_INVALID_STATE) {
                    _this.skipBrokenAd({
                        message: message,
                        code: code,
                    });
                }
            }
            else {
                _this.emit(event_1.PLAYER_EVENTS.error, {
                    type: constants_1.ErrorType.MEDIA_ERROR,
                    message: message,
                    code: code,
                    fatal: true,
                    errorSource: error_1.ERROR_SOURCE.AVPLAY_ERROR,
                });
            }
        };
        _this.streamCompleteHandler = function (adDiscontinued) {
            var _a;
            if (adDiscontinued === void 0) { adDiscontinued = false; }
            _this.setState(constants_1.State.completed);
            _this.stop();
            _this.close();
            // Avoid parameter such as event
            var isAdDiscontinued = adDiscontinued === true;
            if (_this.isAd()) {
                if (!isAdDiscontinued) {
                    // Trigger the adComplete event when the ad playback completes
                    /* istanbul ignore next */
                    _this.emit(event_1.PLAYER_EVENTS.adComplete, {
                        ad: _this.currentAd,
                        adsCount: _this.adCount,
                        adSequence: _this.adSequence,
                        adPosition: _this.adPosition,
                        isPreroll: _this.isPreroll(),
                        isPAL: !!((_a = _this.currentAd) === null || _a === void 0 ? void 0 : _a.icon),
                        // We haven't support this field on Samsung adapter
                        consecutiveCodeSkips: 0,
                        totalDurationIncludePause: (0, time_1.timeDiffInMilliseconds)(_this.adStartTimestamp, (0, time_1.now)()),
                        totalDurationExcludePause: (0, time_1.timeDiffInMilliseconds)(_this.adStartTimestamp, (0, time_1.now)()) - _this.adPauseDuration,
                    });
                }
                if (_this.adPodPlaybackDetail) {
                    _this.adPodPlaybackDetail[isAdDiscontinued ? 'failureCount' : 'successCount']++;
                }
                _this.adPosition = 0;
                // make sure that 100 percent tracking happens
                _this.adTrack(Number.POSITIVE_INFINITY);
                _this.currentAd = undefined;
                if (_this.adSequence < _this.adCount) {
                    _this.playNextAd();
                }
                else {
                    _this.trackAdPodComplete();
                    _this.adCount = 0;
                    _this.adSequence = 0;
                    _this.adQueue = [];
                    var isResumeFromPreroll = _this.isPlayingPreroll;
                    _this.isPlayingPreroll = false;
                    _this.resume({
                        isAfterAd: true,
                        isFromPreroll: isResumeFromPreroll,
                        startLoadType: (0, tools_1.getStartLoadType)(isResumeFromPreroll, 'resumeFromMidroll'),
                    });
                }
            }
            else {
                _this.emit(event_1.PLAYER_EVENTS.complete);
            }
        };
        _this.handleVisibilityChange = function () {
            if (_this.isTerminated) {
                return;
            }
            _this.log('visibilityChangeTo:', document.hidden);
            if (document.hidden && !_this.haveSuspended) {
                // valid states for avplayer.suspend
                if (!_this.isReadyPlayingPaused()) {
                    return;
                }
                try {
                    _this.avplayer.suspend();
                    _this.haveSuspended = true;
                }
                catch (e) {
                    _this.exceptionHandler('suspend', e);
                }
            }
            else if (!document.hidden && _this.haveSuspended) {
                // valid states for avplayer restore
                if (!['NONE', 'PLAYING', 'PAUSED'].includes(_this.getSDKState())) {
                    return;
                }
                // reset it. We will reset the state when app go foreground from background
                _this.hasEmittedAudioTracksAvailable = false;
                try {
                    // The typescript declaration is not accurate. This API allows calling without parameters
                    _this.avplayer.restore();
                    _this.haveSuspended = false;
                }
                catch (e) {
                    _this.exceptionHandler('restore', e);
                }
            }
        };
        _this.log = (0, tools_1.isPlayerDebugEnabled)(config.debugLevel) ? (0, tools_1.debug)('SamsungAdapter') : function () { };
        _this.mediaUrl = config.mediaUrl;
        _this.cdn = (0, tools_1.getUrlHost)(config.mediaUrl);
        _this.config = config;
        _this.elContainer = config.playerContainer;
        _this.avplayer = window.webapis.avplay;
        _this.SDKVersion = _this.avplayer.getVersion();
        /**
         * This was founded in the 2019 Beijing office model.
         * Regardless of the audio track, the getCurrentStreamInfo API remains unchanged.
         * Therefore, we must store this value ourselves in this version.
         */
        /* istanbul ignore next */
        if (_this.SDKVersion === '4.1') {
            _this.isGetCurrentStreamInfoReliable = false;
        }
        /**
         * Founded this in the model 2017/2020-1 of the Beijing office.
         * The setSelectTrack API's id parameter is the index of the total track array but not the index property on the track object.
         */
        /* istanbul ignore next */
        if (_this.SDKVersion === '4.0') {
            _this.useTrackIndexToSetAudioTrack = true;
        }
        _this.resumePosition = _this.contentPosition = _this.config.resumePosition || 0;
        // captions
        _this.captionsElement = _this.elContainer.querySelector("[data-id=\"".concat(SamsungAdapter.CAPTIONS_AREA_ID, "\"]"));
        _this.captionsWindowElement = _this.elContainer.querySelector("[data-id=\"".concat(SamsungAdapter.CAPTIONS_WINDOW_ID, "\"]"));
        _this.adContainerElement = _this.elContainer.querySelector("[data-id=\"".concat(SamsungAdapter.AD_COMPONENT_ID, "\"]"));
        return _this;
    }
    Object.defineProperty(SamsungAdapter.prototype, "SDKName", {
        get: function () {
            return 'AVPlayer';
        },
        enumerable: false,
        configurable: true
    });
    SamsungAdapter.prototype.getSDKVersion = function () {
        return this.SDKVersion;
    };
    SamsungAdapter.prototype.setup = function () {
        var prerollUrl = this.config.prerollUrl;
        if (prerollUrl) {
            this.isPlayingPreroll = true;
            // if preroll ad exists, play it first
            this.playAdTag(prerollUrl);
        }
        else {
            this.emit(event_1.PLAYER_EVENTS.startLoad, {
                isResumeFromAd: false,
                isResumeFromPreroll: false,
                startLoadType: 'startup',
            });
            this.currentTimeProgressed = false;
            this.load(this.mediaUrl, this.getPosition(), false);
        }
        this.detachExtraEvents = this.attachExtraEvents();
    };
    SamsungAdapter.prototype.load = function (url, position, isAd) {
        var _this = this;
        if (isAd === void 0) { isAd = false; }
        this.log('loadUrl', url, position, isAd);
        var licenseUrl = this.config.licenseUrl;
        /* istanbul ignore next */
        var videoUrl = url || this.mediaUrl;
        this.isPlayingAd = isAd;
        if (isAd && (0, dom_1.isSamsung2015)()) {
            videoUrl = videoUrl.replace(/^https/, 'http');
        }
        if (isAd) {
            if (this.adSequence <= 1) {
                this.emit(event_1.PLAYER_EVENTS.adPlayerSetup, this.isPreroll());
            }
            this.emit(event_1.PLAYER_EVENTS.adStartLoad, {
                isPreroll: this.isPreroll(),
            });
            this.adCurrentTimeProgressed = false;
            this.adStartFired = false;
            this.adStartTimestamp = (0, time_1.now)();
            this.adPauseDuration = 0;
        }
        this.haveSuspended = false;
        this.avplayer.open(videoUrl);
        this.setDisplay();
        this.detachPlayerEvents = this.attachPlayerEvents();
        // "setBufferingParam" sets the min buffer size, which means only when the buffer duration reaches 4s, it is allowed to play.
        // The default value is 10s, and 4s is the shortest duration that can be set.
        // After seeking/resuming, the video should start asap, therefore we would want to set it to 4s.
        this.avplayer.setBufferingParam('PLAYER_BUFFER_FOR_PLAY', 'PLAYER_BUFFER_SIZE_IN_SECOND', 4);
        this.avplayer.setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', 4);
        // The code snippet in Samsung's API doc is not accurate (it passes "GetChallenge:true", but actually it should not).
        // https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html
        // We should use the following code exmpale instead.
        // https://github.com/SamsungDForum/PlayerAVPlayDRM/blob/205d1cec423661d2f3f49fc12a88c02456711075/PlayerAVPlayDRM/videoPlayer.js#L289
        if (licenseUrl && !this.isAd()) {
            this.setDrmLicense(licenseUrl);
        }
        this.avplayer.prepareAsync(function () {
            var _a;
            // Trigger adStart event if it is an ad
            if (_this.isAd()) {
                /* istanbul ignore next */
                _this.emit(event_1.PLAYER_EVENTS.adStart, {
                    ad: _this.currentAd,
                    adsCount: _this.adCount,
                    adSequence: _this.adSequence,
                    adPosition: 0, // The position of ad start is always 0
                    isPreroll: _this.isPreroll(),
                    isPAL: !!((_a = _this.currentAd) === null || _a === void 0 ? void 0 : _a.icon),
                    // We haven't support this field on Samsung adapter
                    consecutiveCodeSkips: 0,
                });
                _this.adStartFired = true;
            }
            else {
                if (!_this.isReady) {
                    _this.isReady = true;
                    _this.emit(event_1.PLAYER_EVENTS.ready);
                    // NOTE init captions list after oninit callback invoked in Player.js, so that upper level components
                    // could handle subtitle relevant events
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
                }
                _this.emit(event_1.PLAYER_EVENTS.canPlay);
            }
            if ((0, isAutoStartEnabled_1.isAutoStartEnabled)(_this.config) || _this.isAd()) {
                _this.playFromPosition(position);
            }
        }, function (err) {
            _this.log(err, 'Samsung adapter init error');
            // if the player fails to play the ads, the error will be caught here
            if (_this.isAd()) {
                _this.skipBrokenAd(err);
            }
            else {
                // report broken content url and position
                _this.emit(event_1.PLAYER_EVENTS.error, {
                    type: constants_1.ErrorType.SETUP_ERROR,
                    code: err.code,
                    message: err.message,
                    reason: err.name,
                    error: err,
                    fatal: true,
                    errorSource: error_1.ERROR_SOURCE.AVPLAY_ERROR,
                });
            }
        });
    };
    /**
     * Indicate whether ad is playing now
     */
    SamsungAdapter.prototype.isAd = function () {
        return this.isPlayingAd;
    };
    /**
     * Get the CDN name of the current playback
     */
    SamsungAdapter.prototype.getCDN = function () {
        return this.cdn;
    };
    /**
     * Get the current selected captions index
     */
    SamsungAdapter.prototype.getCaptions = function () {
        return this.captionsIndex;
    };
    SamsungAdapter.prototype.getIsBuffering = function () {
        return this.isBuffering;
    };
    /**
     * Set selected captions index
     * @param index new selected captions index
     */
    SamsungAdapter.prototype.setCaptions = function (index) {
        var _this = this;
        if (this.captionsIndex === index || this.captionsList[index] === undefined)
            return;
        this.captionsIndex = index;
        this.captionsData = [];
        var currentCaptions = this.getCurrentCaptions();
        this.emit(event_1.PLAYER_EVENTS.captionsChange, { captionsIndex: this.captionsIndex });
        this.log('setCaptions', index, this.captionsIndex, currentCaptions);
        if (this.captionsIndex === 0) {
            if (this.captionsWindowElement) {
                this.captionsWindowElement.innerHTML = '';
            }
            this.hideCaptions();
            return;
        }
        (0, captions_1.fetchData)(currentCaptions.id)
            .then(function (data) {
            _this.captionsData = data;
            _this.showCaptions();
        })
            .catch(function (error) {
            _this.log('fetch subtitle error', error);
            _this.emit(event_1.PLAYER_EVENTS.captionsError, {
                type: types_1.CaptionsErrorType.CAPTIONS_ERROR,
                message: error.message,
            });
            // if something bad happens, just turn off captions
            _this.setCaptions(0);
        });
    };
    SamsungAdapter.prototype.setDrmLicense = function (licenseUrl) {
        try {
            this.avplayer.setDrm('PLAYREADY', 'SetProperties', JSON.stringify({
                DeleteLicenseAfterUse: true,
                LicenseServer: licenseUrl,
            }));
        }
        catch (error) {
            this.log('setDrm Error:', error);
            this.emit(event_1.PLAYER_EVENTS.error, {
                type: constants_1.ErrorType.DRM_ERROR,
                name: error_1.TIZEN_DRM_ERROR,
                message: error_1.TIZEN_SET_DRM_ERROR,
                fatal: true,
                error: error,
                errorSource: error_1.ERROR_SOURCE.AVPLAY_ERROR,
            });
        }
    };
    SamsungAdapter.prototype.attachPlayerEvents = function () {
        var _this = this;
        if (this.detachPlayerEvents) {
            this.detachPlayerEvents();
            this.detachPlayerEvents = undefined;
        }
        var listeners = {
            onbufferingstart: this.onBufferingStart,
            onbufferingcomplete: this.onBufferingComplete,
            oncurrentplaytime: this.onCurrentPlayTime,
            ondrmevent: this.onDRMEvent,
            onerror: this.errorHandler,
            onstreamcompleted: this.streamCompleteHandler,
        };
        this.avplayer.setListener(listeners);
        return function () {
            _this.avplayer.setListener({});
        };
    };
    SamsungAdapter.prototype.handleError = function (eventType, apiCall) {
        var errorMessage = "event type error: ".concat(eventType, " ").concat(apiCall);
        this.log(errorMessage);
        if (this.isAd()) {
            if (eventType !== error_1.TIZEN_PLAYER_ERROR_INVALID_STATE) {
                this.skipBrokenAd({ message: errorMessage });
            }
        }
        else {
            var error = {
                message: errorMessage,
                type: constants_1.ErrorType.MEDIA_ERROR,
                fatal: false,
                errorSource: error_1.ERROR_SOURCE.AVPLAY_ERROR,
            };
            if (eventType === error_1.TIZEN_CONNECTION_FAILED_ERROR) {
                error.type = constants_1.ErrorType.NETWORK_ERROR;
                error.fatal = true;
                error.message = eventType;
            }
            this.emit(event_1.PLAYER_EVENTS.error, error);
        }
    };
    /**
     * skip broken ads. A known issue is that if ads request return 503, playback will stuck there
     * @private
     */
    SamsungAdapter.prototype.skipBrokenAd = function (err) {
        var _this = this;
        var _a;
        var _b = this, adCount = _b.adCount, adPosition = _b.adPosition, currentAd = _b.currentAd, adSequence = _b.adSequence;
        this.emit(event_1.PLAYER_EVENTS.adError, {
            code: err.code,
            message: err.message || '',
            reason: err.name,
        }, {
            ad: currentAd,
            adsCount: adCount,
            adSequence: adSequence,
            adPosition: adPosition,
            isPreroll: this.isPreroll(),
            lagTime: this.getAdLagTime(),
        });
        var vastErrorCode = '';
        switch (err.message) {
            case error_1.TIZEN_CONNECTION_FAILED_ERROR:
                vastErrorCode = error_1.VAST_ERROR_CODE.MEDIA_FILE_TIMEOUT;
                break;
            case error_1.TIZEN_UNSUPPORTED_FILE:
                vastErrorCode = error_1.VAST_ERROR_CODE.MEDIA_DECODE_ERROR;
                break;
            default:
                vastErrorCode = error_1.VAST_ERROR_CODE.MEDIA_PLAYER_ERROR;
                break;
        }
        if (currentAd === null || currentAd === void 0 ? void 0 : currentAd.error) {
            adTools.sendVASTErrorBeacon(currentAd.error, vastErrorCode, function (err) {
                _this.emit(event_1.PLAYER_EVENTS.adBeaconFail, err, {
                    id: currentAd.id,
                    type: 'error',
                });
            });
        }
        this.emit(event_1.PLAYER_EVENTS.adDiscontinue, {
            reason: err.name || '',
            adStartFired: this.adStartFired,
            videoPaused: !!((_a = this.adPodPlaybackDetail) === null || _a === void 0 ? void 0 : _a.pauseStartTimestamp),
            videoStarted: this.resumePosition !== this.getPosition(),
            lagTime: this.getAdLagTime(),
            // We haven't support this field on Samsung adapter
            consecutiveCodeSkips: 0,
        });
        this.streamCompleteHandler(true);
    };
    SamsungAdapter.prototype.attachExtraEvents = function () {
        var _this = this;
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        return function () {
            document.removeEventListener('visibilitychange', _this.handleVisibilityChange);
        };
    };
    SamsungAdapter.prototype.emitPlayEvent = function () {
        if (this.isAd()) {
            this.emit(event_1.PLAYER_EVENTS.adPlay);
        }
        else {
            this.emit(event_1.PLAYER_EVENTS.play);
            this.tryToGetAudioTracks();
        }
    };
    SamsungAdapter.prototype.setDisplay = function () {
        this.log('setdisplay rect', parseInt((0, dom_1.getComputedValue)(this.elContainer, 'width'), 10), parseInt((0, dom_1.getComputedValue)(this.elContainer, 'height'), 10));
        this.avplayer.setDisplayRect(0, 0, parseInt((0, dom_1.getComputedValue)(this.elContainer, 'width'), 10), parseInt((0, dom_1.getComputedValue)(this.elContainer, 'height'), 10));
        // use letter box to avoid stretching
        this.avplayer.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');
    };
    SamsungAdapter.prototype.getAdUrl = function () {
        var _a;
        /* istanbul ignore next: ignore optional chaining */
        return (_a = this.getCurrentAd()) === null || _a === void 0 ? void 0 : _a.video;
    };
    SamsungAdapter.prototype.getCurrentAd = function () {
        return this.currentAd;
    };
    SamsungAdapter.prototype.getAdList = function () {
        return this.adQueue;
    };
    SamsungAdapter.prototype.getAdSequence = function () {
        return this.adSequence;
    };
    SamsungAdapter.prototype.getAdLagTime = function () {
        return (0, time_1.timeDiffInMilliseconds)(this.adStartTimestamp, (0, time_1.now)());
    };
    /**
     * Get volume setting
     * NOTE: Samsung avplayer do not have such api, here is an empty implement
     */
    /* istanbul ignore next */
    SamsungAdapter.prototype.getVolume = function () {
        return -1;
    };
    /**
     * Set volume
     * NOTE: Samsung avplayer do not have such api, here is an empty implement
     */
    /* istanbul ignore next */
    SamsungAdapter.prototype.setVolume = function (_volume) { };
    /**
     * Get mute state
     * NOTE: Samsung avplayer do not have such api, here is an empty implement
     */
    /* istanbul ignore next */
    SamsungAdapter.prototype.getMute = function () {
        return false;
    };
    /**
     * Set mute state
     * @param mute new mute state
     * NOTE: Samsung avplayer do not have such api, here is an empty implement
     */
    /* istanbul ignore next */
    SamsungAdapter.prototype.setMute = function (_mute) { };
    SamsungAdapter.prototype.playFromPosition = function (position) {
        var _this = this;
        this.log('play from position', position);
        if (position > 0) {
            var handler = function () {
                _this.play();
                _this.hasEmittedAudioTracksAvailable = false;
            };
            this.once(event_1.PLAYER_EVENTS.seeked, handler);
            this.seek(position);
        }
        else {
            this.play();
        }
    };
    SamsungAdapter.prototype.play = function () {
        var _a;
        // https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html#AVPlayManager-play
        /* istanbul ignore next */
        if (this.isTerminated || ['PLAYING', 'NONE', 'IDLE'].includes(this.getSDKState()))
            return;
        this.emitPlayEvent();
        this.log('start play');
        if (this.isAd()) {
            this.hideCaptions();
        }
        else if (this.captionsIndex > 0 && this.captionsData.length) {
            this.showCaptions();
        }
        if (this.isAd() && ((_a = this.adPodPlaybackDetail) === null || _a === void 0 ? void 0 : _a.pauseStartTimestamp)) {
            var pauseDuration = (0, time_1.timeDiffInMilliseconds)(this.adPodPlaybackDetail.pauseStartTimestamp, (0, time_1.now)());
            this.adPauseDuration += pauseDuration;
            this.adPodPlaybackDetail.pauseDuration += pauseDuration;
            delete this.adPodPlaybackDetail.pauseStartTimestamp;
        }
        try {
            this.avplayer.play();
        }
        catch (e) {
            this.exceptionHandler('play', e);
        }
        // TODO: We will parse the manifest when the play event is triggered. However, we trigger the play event before we call the play function. This causes an invalid state error. So I add another parse manifest call here, and we will fix the play event order issue with an experiment later.
        if (!this.isAd()) {
            this.tryToGetAudioTracks();
        }
    };
    SamsungAdapter.prototype.playAdTag = function (tag) {
        var _this = this;
        var _a, _b;
        this.log('playAdTag', tag);
        var requestPosition = this.getPosition();
        var adRequestProcessBeforeFetch = this.config.adRequestProcessBeforeFetch;
        this.emit(event_1.PLAYER_EVENTS.adPodFetch, {
            isPreroll: this.isPlayingPreroll,
        });
        var ignoreErroredAds = (_b = (_a = this.config).getIgnoreErroredAds) === null || _b === void 0 ? void 0 : _b.call(_a);
        adTools.fetchJsonAds(tag, {
            requestProcessBeforeFetch: adRequestProcessBeforeFetch,
            ignoreErroredAds: ignoreErroredAds,
            adBeaconFailedHandler: function (error, adId) {
                _this.emit(event_1.PLAYER_EVENTS.adBeaconFail, error, { id: adId, type: 'error' });
            },
        })
            .then(function (_a) {
            var ads = _a.ads, metrics = _a.metrics;
            _this.emit(event_1.PLAYER_EVENTS.adPodFetchSuccess, {
                isPreroll: _this.isPlayingPreroll,
                responseTime: metrics.responseTime,
                adsCount: ads.length,
            });
            if (_this.state === constants_1.State.destroyed) {
                return;
            }
            _this.playAdArray({
                ads: ads,
                isPreroll: _this.config.prerollUrl === tag,
                requestPosition: requestPosition,
                metrics: metrics,
            });
        })
            .catch(function (error) {
            _this.emit(event_1.PLAYER_EVENTS.adPodFetchError, {
                isPreroll: _this.isPlayingPreroll,
                message: error === null || error === void 0 ? void 0 : error.message,
                retries: error === null || error === void 0 ? void 0 : error.retries,
            });
            if (_this.state === constants_1.State.destroyed) {
                return;
            }
            var isResumeFromPreroll = _this.isPlayingPreroll;
            _this.isPlayingPreroll = false;
            _this.resume({
                isAfterAd: false,
                isFromPreroll: isResumeFromPreroll,
                startLoadType: (0, tools_1.getStartLoadType)(isResumeFromPreroll, 'resumeAfterNoAds'),
            });
        });
    };
    SamsungAdapter.prototype.playAdResponse = function (adResponse) {
        this.playAdArray({
            ads: adResponse,
            isPreroll: false,
        });
        return Promise.resolve();
    };
    SamsungAdapter.prototype.isPreroll = function () {
        return this.isPlayingPreroll;
    };
    SamsungAdapter.prototype.playAdArray = function (adData) {
        var ads = adData.ads, isPreroll = adData.isPreroll;
        this.log('play ad array', ads.length, isPreroll);
        if (this.isTerminated)
            return;
        if (ads.length === 0) {
            this.emit(event_1.PLAYER_EVENTS.adPodEmpty, {
                isPreroll: isPreroll,
            });
            this.isPlayingPreroll = false;
            /* istanbul ignore else */
            if (isPreroll) {
                // resume since the media has not been set if there is a preroll ad exists
                this.resume({
                    isAfterAd: false,
                    isFromPreroll: true,
                    startLoadType: 'startup',
                });
            }
            // however, for midroll ads there is no need to resume since the media is still in playback
            return;
        }
        this.emit(event_1.PLAYER_EVENTS.adResponse, {
            response: ads,
            isPreroll: this.isPreroll(),
            requestPosition: adData.requestPosition,
            metrics: adData.metrics,
        });
        // close the previous content video
        this.stop();
        this.close();
        this.adQueue = ads;
        this.adSequence = 0;
        this.adCount = ads.length;
        this.adPodPlaybackDetail = {
            successCount: 0,
            failureCount: 0,
            adPodStartTimestamp: (0, time_1.now)(),
            pauseDuration: 0,
        };
        this.playNextAd();
    };
    SamsungAdapter.prototype.playNextAd = function () {
        var _this = this;
        var currentAd = this.adQueue[this.adSequence++];
        if (!currentAd) {
            var isPreroll = this.isPreroll();
            this.emit(event_1.PLAYER_EVENTS.adError, { fatal: false, message: 'unexpected ad state' }, {
                adSequence: this.adSequence,
                adsCount: this.adCount,
                isPreroll: isPreroll,
                lagTime: this.getAdLagTime(),
            });
            this.resume({
                isAfterAd: this.adSequence > 1,
                isFromPreroll: isPreroll,
                startLoadType: (0, tools_1.getStartLoadType)(isPreroll, 'resumeAfterAbormalAd'),
            });
            return;
        }
        this.log('playNextAd', currentAd);
        var trackAdErrorHandler = function (err) {
            _this.emit(event_1.PLAYER_EVENTS.adBeaconFail, err, { id: currentAd.id, type: 'impression' });
        };
        this.adTrackFn = adTools.getAdTrackFn(currentAd, {
            errorHandler: trackAdErrorHandler,
        });
        this.currentAd = currentAd;
        if (currentAd.icon) {
            this.emit(event_1.PLAYER_EVENTS.adIconVisible, currentAd.icon);
        }
        /* istanbul ignore next */
        this.load(currentAd ? currentAd.video : '', 0, true);
    };
    SamsungAdapter.prototype.pause = function () {
        // https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html#AVPlayManager-pause
        if (this.isTerminated || ['PAUSED', 'NONE', 'IDLE'].includes(this.getSDKState()))
            return;
        var type = this.isAd() ? event_1.PLAYER_EVENTS.adPause : event_1.PLAYER_EVENTS.pause;
        this.emit(type);
        try {
            this.avplayer.pause();
            this.setState(constants_1.State.paused);
            if (this.adPodPlaybackDetail) {
                this.adPodPlaybackDetail.pauseStartTimestamp = (0, time_1.now)();
            }
        }
        catch (e) {
            /* istanbul ignore next */
            this.exceptionHandler('pause', e);
        }
    };
    SamsungAdapter.prototype.seek = function (position) {
        var _this = this;
        // https://developer.samsung.com/smarttv/develop/api-references/samsung-product-api-references/avplay-api.html#AVPlayManager-seekTo
        if (['NONE'].includes(this.getSDKState()))
            return;
        var pos = Math.max(0, Math.min(this.getDuration(), position));
        this.emit(event_1.PLAYER_EVENTS.seek, {
            position: this.getPosition(),
            offset: pos,
        });
        this.log("seek from ".concat(this.getPosition(), " to ").concat(pos));
        this.isSeeking = true;
        this.avplayer.seekTo(pos * 1000, function () {
            _this.isSeeking = false;
            _this.contentPosition = pos;
            _this.emit(event_1.PLAYER_EVENTS.seeked, {
                offset: _this.getPosition(),
            });
        }, function () {
            _this.isSeeking = false;
            _this.emit(event_1.PLAYER_EVENTS.seekFailed, {
                position: _this.getPosition(),
                offset: pos,
            });
        });
    };
    SamsungAdapter.prototype.stop = function () {
        this.avplayer.stop();
        this.emit(event_1.PLAYER_EVENTS.stop);
    };
    SamsungAdapter.prototype.close = function () {
        this.avplayer.close();
    };
    SamsungAdapter.prototype.resume = function (resumeConfig) {
        var isAfterAd = resumeConfig.isAfterAd, isFromPreroll = resumeConfig.isFromPreroll, startLoadType = resumeConfig.startLoadType;
        /* istanbul ignore next */
        if (this.isTerminated)
            return;
        this.emit(event_1.PLAYER_EVENTS.startLoad, {
            isResumeFromAd: isAfterAd,
            isResumeFromPreroll: isFromPreroll,
            startLoadType: startLoadType,
        });
        this.currentTimeProgressed = false;
        this.resumePosition = this.contentPosition;
        this.load(this.mediaUrl, this.contentPosition);
    };
    SamsungAdapter.prototype.remove = function () {
        if (this.state === constants_1.State.destroyed) {
            return;
        }
        this.isTerminated = true;
        this.setState(constants_1.State.destroyed);
        this.stop();
        this.close();
        this.detachPlayerEvents && this.detachPlayerEvents();
        this.detachExtraEvents && this.detachExtraEvents();
    };
    SamsungAdapter.prototype.reload = function (_a) {
        var position = _a.position, skipPreroll = _a.skipPreroll;
        this.stop();
        this.close();
        if (position !== undefined) {
            this.contentPosition = position;
        }
        var startPosition = this.getPosition();
        if (this.config.prerollUrl && startPosition <= 0 && !skipPreroll) {
            // if preroll ad exists, play it first
            this.playAdTag(this.config.prerollUrl);
        }
        else {
            this.load(this.mediaUrl, startPosition);
        }
        return Promise.resolve();
    };
    SamsungAdapter.prototype.setMediaUrl = function (mediaUrl, position, config) {
        if (position === void 0) { position = 0; }
        this.stop();
        this.close();
        this.config.licenseUrl = config.licenseUrl;
        this.mediaUrl = mediaUrl;
        if (!this.isAd()) {
            this.load(mediaUrl, position);
        }
        return Promise.resolve();
    };
    // the element needed for Suitest adapter is with the id 'av-player' as htmlStr is
    /* istanbul ignore next */
    SamsungAdapter.prototype.getContentVideoElement = function () {
        return undefined;
    };
    /* istanbul ignore next */
    SamsungAdapter.prototype.getCurrentVideoElement = function () {
        return undefined;
    };
    SamsungAdapter.prototype.getExternalVideoObject = function () {
        return this.elContainer.querySelector('[data-id="av-player"]') || undefined;
    };
    SamsungAdapter.prototype.getVideoUrl = function () {
        return this.mediaUrl;
    };
    SamsungAdapter.prototype.getDuration = function () {
        return Math.round(this.avplayer.getDuration() / 1000);
    };
    SamsungAdapter.prototype.getPosition = function () {
        return this.contentPosition;
    };
    SamsungAdapter.prototype.getPrecisePosition = function () {
        return this.avplayer.getCurrentTime() / 1000;
    };
    /**
     * get ad current playback position, in seconds
     */
    SamsungAdapter.prototype.getAdPosition = function () {
        return this.isPlayingAd ? this.adPosition : undefined;
    };
    /**
     * get ad current playback duration, in seconds
     */
    SamsungAdapter.prototype.getAdDuration = function () {
        return this.isPlayingAd ? this.getDuration() : undefined;
    };
    SamsungAdapter.prototype.getBitrate = function () {
        var _a, _b;
        return (_b = (_a = this.getCurrentTrackInfo('VIDEO')) === null || _a === void 0 ? void 0 : _a.Bit_rate) !== null && _b !== void 0 ? _b : -1;
    };
    SamsungAdapter.prototype.getRendition = function () {
        var videoTrackExtraInfo = this.getCurrentTrackInfo('VIDEO');
        if (!videoTrackExtraInfo)
            return '';
        var Width = videoTrackExtraInfo.Width, Height = videoTrackExtraInfo.Height, Bit_rate = videoTrackExtraInfo.Bit_rate;
        return (0, tools_1.buildRenditionString)({ width: Width, height: Height, bitrate: Bit_rate });
    };
    SamsungAdapter.prototype.getAutoLevelEnabled = function () {
        return true;
    };
    SamsungAdapter.prototype.getVideoCodec = function () {
        var _a, _b;
        return (_b = (_a = this.getCurrentTrackInfo('VIDEO')) === null || _a === void 0 ? void 0 : _a.fourCC) !== null && _b !== void 0 ? _b : '';
    };
    SamsungAdapter.prototype.getAudioCodec = function () {
        var _a, _b;
        return (_b = (_a = this.getCurrentTrackInfo('AUDIO')) === null || _a === void 0 ? void 0 : _a.fourCC) !== null && _b !== void 0 ? _b : '';
    };
    SamsungAdapter.prototype.getCodecs = function () {
        return "".concat(this.getVideoCodec(), ",").concat(this.getAudioCodec());
    };
    SamsungAdapter.prototype.getSDKState = function () {
        return this.avplayer.getState();
    };
    SamsungAdapter.prototype.setState = function (state) {
        this.state = state;
    };
    SamsungAdapter.prototype.getState = function () {
        return this.state;
    };
    SamsungAdapter.prototype.setCaptionsList = function (tracks) {
        this._captionsList = tracks;
        // if no valid captions, return without adding a unnecessary `off` option
        if (tracks.length === 0)
            return;
        this.emit(event_1.PLAYER_EVENTS.captionsListChange, { captionsList: this.captionsList });
        this.emit(event_1.PLAYER_EVENTS.allCaptionsAvailable, { captionsList: this.captionsList });
    };
    Object.defineProperty(SamsungAdapter.prototype, "captionsList", {
        get: function () {
            if (this._captionsList.length === 0) {
                return [];
            }
            return tslib_1.__spreadArray([constants_1.FROZEN_CAPTIONS_OFF], this._captionsList, true);
        },
        enumerable: false,
        configurable: true
    });
    SamsungAdapter.prototype.getCaptionsList = function () {
        return this.captionsList;
    };
    SamsungAdapter.prototype.getCurrentCaptions = function () {
        return this.captionsList[this.captionsIndex];
    };
    SamsungAdapter.prototype.showCaptions = function () {
        var _this = this;
        this.log('showCaptions', this.config.captionsStyles);
        /* istanbul ignore else */
        if (this.config.captionsStyles) {
            var _a = this.config.captionsStyles, font = _a.font, windowStyles_1 = _a.window;
            this.captionStyle = (0, captions_1.convertStyleObjectToString)(font);
            Object.keys(windowStyles_1).forEach(function (styleName) {
                _this.captionsWindowElement.style[styleName] = windowStyles_1[styleName];
            });
        }
        this.captionsElement.style.display = 'block';
    };
    SamsungAdapter.prototype.hideCaptions = function () {
        this.captionsElement.style.display = 'none';
    };
    SamsungAdapter.prototype.updateCaptionsText = function (text) {
        var _this = this;
        /* istanbul ignore next */
        this.captionsWindowElement.innerHTML = text
            ? text.map(function (line) { return "<span style=\"".concat(_this.captionStyle, "\">").concat(line, "</span>"); }).join('')
            : '';
    };
    /**
     * @param time (ms)
     */
    SamsungAdapter.prototype.checkCaptions = function (time) {
        /* istanbul ignore if */
        if (this.captionsData.length === 0)
            return;
        var result = (0, captions_1.locate)(time, this.captionsData);
        /* istanbul ignore else */
        if (!result) {
            this.updateCaptionsText();
        }
        else {
            this.updateCaptionsText(result.text);
        }
    };
    SamsungAdapter.prototype.getCurrentAudioTrack = function () {
        if (this.audioTrackInfoArray.length <= 0)
            return;
        if (!this.isGetCurrentStreamInfoReliable && this.unsafeCurrentAudioTrack) {
            return this.unsafeCurrentAudioTrack;
        }
        var audioTrackExtraInfo = this.getCurrentTrackInfo('AUDIO');
        if (!audioTrackExtraInfo)
            return;
        var totalTracksInfo = this.getTotalTrackInfo().filter(function (_a) {
            var type = _a.type;
            return type === 'AUDIO';
        });
        var index = totalTracksInfo.findIndex(function (track) { return track.index === audioTrackExtraInfo.index; });
        var info = this.audioTrackInfoArray[index] || {
            language: audioTrackExtraInfo.language,
            role: audioTrackExtraInfo.language,
            label: audioTrackExtraInfo.language,
        };
        return {
            id: audioTrackExtraInfo.index,
            language: info.language,
            role: info.role,
            label: info.label,
            active: true,
        };
    };
    SamsungAdapter.prototype.getAudioTracks = function () {
        var _this = this;
        var totalTracksInfo = this.getTotalTrackInfo();
        var currentAudioTrack = this.getCurrentAudioTrack();
        if (!totalTracksInfo || !currentAudioTrack)
            return [];
        var parsedTracks = this.formatStreamInfo(totalTracksInfo);
        /* istanbul ignore next */
        if (!parsedTracks)
            return [];
        return parsedTracks.filter(function (_a) {
            var type = _a.type;
            return type === 'AUDIO';
        }).map(function (track, index) {
            var _a, _b, _c;
            var info = _this.audioTrackInfoArray[index];
            return {
                id: track.index,
                language: (_a = info === null || info === void 0 ? void 0 : info.language) !== null && _a !== void 0 ? _a : track.language,
                role: (_b = info === null || info === void 0 ? void 0 : info.role) !== null && _b !== void 0 ? _b : track.language,
                active: currentAudioTrack.id === track.index,
                label: (_c = info === null || info === void 0 ? void 0 : info.label) !== null && _c !== void 0 ? _c : track.language,
            };
        });
    };
    SamsungAdapter.prototype.setAudioTrack = function (info) {
        if (!this.isReadyPlayingPaused()) {
            return false;
        }
        try {
            var id = this.useTrackIndexToSetAudioTrack
                ? this.getTotalTrackInfo().findIndex(function (track) { return track.type === 'AUDIO' && track.index === info.id; })
                : parseInt("".concat(info.id), 10);
            this.avplayer.setSelectTrack('AUDIO', id);
            this.unsafeCurrentAudioTrack = info;
            return true;
        }
        catch (e) {
            /* istanbul ignore next */
            return false;
        }
    };
    SamsungAdapter.prototype.isReadyPlayingPaused = function () {
        return ['READY', 'PLAYING', 'PAUSED'].includes(this.avplayer.getState());
    };
    SamsungAdapter.prototype.getBandwidthEstimate = function () {
        if (!this.isReadyPlayingPaused()) {
            return -1;
        }
        try {
            return Number(this.avplayer.getStreamingProperty('CURRENT_BANDWIDTH'));
        }
        catch (_a) {
            // some year devices have this string missing the letter d in bandwidth
            // observed that a 2019 was first model where CURRENT_BANDWIDTH worked
            // to be better safe than sorry trying both behind a try...catch
        }
        try {
            return Number(this.avplayer.getStreamingProperty("CURRENT_BAND".concat('WITH')));
        }
        catch (_b) {
            // if the typo also fails ignore and return default
        }
        return -1;
    };
    SamsungAdapter.prototype.getTotalTrackInfo = function () {
        if (!this.isReadyPlayingPaused()) {
            return [];
        }
        return this.avplayer.getTotalTrackInfo();
    };
    SamsungAdapter.prototype.getCurrentStreamInfo = function () {
        if (!this.isReadyPlayingPaused()) {
            return null;
        }
        return this.avplayer.getCurrentStreamInfo();
    };
    SamsungAdapter.prototype.formatStreamInfo = function (streamInfos) {
        /* istanbul ignore next */
        if (!streamInfos)
            return [];
        var tracks = [];
        var _loop_1 = function (currentStreamInfo) {
            try {
                var extraInfo_1 = JSON.parse(currentStreamInfo.extra_info);
                /* istanbul ignore else */
                if (currentStreamInfo.type === 'VIDEO') {
                    ['Width', 'Height', 'Bit_rate'].forEach(function (key) { extraInfo_1[key] = parseFloat(extraInfo_1[key]); });
                }
                else if (currentStreamInfo.type === 'AUDIO') {
                    ['channels', 'sample_rate', 'bit_rate'].forEach(function (key) { extraInfo_1[key] = parseInt(extraInfo_1[key], 10); });
                }
                else if (currentStreamInfo.type === 'TEXT') {
                    ['track_num', 'subtitle_type'].forEach(function (key) { extraInfo_1[key] = parseInt(extraInfo_1[key], 10); });
                }
                var currentTrack = tslib_1.__assign({ index: currentStreamInfo.index, type: currentStreamInfo.type }, extraInfo_1);
                tracks.push(currentTrack);
            }
            catch (e) {
                return "continue";
            }
        };
        for (var _i = 0, streamInfos_1 = streamInfos; _i < streamInfos_1.length; _i++) {
            var currentStreamInfo = streamInfos_1[_i];
            _loop_1(currentStreamInfo);
        }
        return tracks;
    };
    SamsungAdapter.prototype.getCurrentTrackInfo = function (target) {
        var currentStreamInfo = this.getCurrentStreamInfo();
        if (!currentStreamInfo)
            return null;
        var tracks = this.formatStreamInfo(currentStreamInfo);
        var track = tracks.filter(function (_a) {
            var type = _a.type;
            return type === target;
        })[0];
        /* istanbul ignore next */
        if (!track)
            return null;
        return track;
    };
    SamsungAdapter.prototype.parseAudioTracks = function (manifest) {
        return (0, dash_1.parseAudioTracks)(manifest);
    };
    SamsungAdapter.prototype.parseAudioTracksFromManifest = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var res, manifest, audioTracks;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.hasAudioTrackParseBeenRequested) {
                            return [2 /*return*/];
                        }
                        this.hasAudioTrackParseBeenRequested = true;
                        return [4 /*yield*/, (0, fetchWrapper_1.xhrRequest)(this.mediaUrl, { responseType: 'text' })];
                    case 1:
                        res = _a.sent();
                        return [4 /*yield*/, res.text()];
                    case 2:
                        manifest = _a.sent();
                        this.log('manifest got');
                        try {
                            this.audioTrackInfoArray = this.parseAudioTracks(manifest);
                            this.log("audio info updated ".concat(this.audioTrackInfoArray.length));
                        }
                        catch (error) {
                            this.log('error parsing audio tracks', error);
                            this.emit(event_1.PLAYER_EVENTS.audioTracksError, error);
                        }
                        audioTracks = this.getAudioTracks();
                        if (audioTracks.length) {
                            this.emit(event_1.PLAYER_EVENTS.audioTracksAvailable, audioTracks);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    SamsungAdapter.prototype.tryToGetAudioTracks = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var audioTracks;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.log('tryToGetAudioTracks');
                        if (this.audioTrackInfoArray.length > 0) {
                            audioTracks = this.getAudioTracks();
                            if (audioTracks.length && !this.hasEmittedAudioTracksAvailable) {
                                this.hasEmittedAudioTracksAvailable = true;
                                this.emit(event_1.PLAYER_EVENTS.audioTracksAvailable, audioTracks);
                            }
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, this.parseAudioTracksFromManifest()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SamsungAdapter.prototype.trackAdPodComplete = function () {
        if (!this.adPodPlaybackDetail)
            return;
        var _a = this.adPodPlaybackDetail, successCount = _a.successCount, failureCount = _a.failureCount, adPodStartTimestamp = _a.adPodStartTimestamp, pauseDuration = _a.pauseDuration;
        var duration = adTools.getAdPodDuration(this.adQueue);
        this.emit(event_1.PLAYER_EVENTS.adPodComplete, {
            position: this.getPosition(),
            successCount: successCount,
            failureCount: failureCount,
            count: this.adCount,
            duration: duration,
            totalDurationIncludePause: (0, time_1.timeDiffInMilliseconds)(adPodStartTimestamp, (0, time_1.now)()),
            totalDurationExcludePause: (0, time_1.timeDiffInMilliseconds)(adPodStartTimestamp, (0, time_1.now)()) - pauseDuration,
            isPreroll: this.isPreroll(),
        });
    };
    SamsungAdapter.prototype.adTrack = function (position) {
        var _a, _b;
        var adQuartile = (_b = (_a = this.adTrackFn) === null || _a === void 0 ? void 0 : _a.call(this, position)) !== null && _b !== void 0 ? _b : -1;
        if (adQuartile >= 0) {
            this.emit(event_1.PLAYER_EVENTS.adQuartile, adQuartile);
        }
    };
    // subtitleArea is for locating subtitle section (top/left/right)
    SamsungAdapter.CAPTIONS_AREA_ID = 'subtitleAreaComponent';
    // subtitleWindow is for rendering window background, its width is decided by caption text's length
    SamsungAdapter.CAPTIONS_WINDOW_ID = 'subtitleWindowComponent';
    SamsungAdapter.AD_COMPONENT_ID = 'adComponent';
    SamsungAdapter.htmlString = "\n    <div data-id=\"".concat(constants_1.PLAYER_CONTAINER_IDS.samsung, "\">\n      <object data-id=\"av-player\" type=\"application/avplayer\"></object>\n      <div data-id=\"").concat(SamsungAdapter.AD_COMPONENT_ID, "\"></div>\n      <div class=\"subtitleArea\" data-id=\"").concat(SamsungAdapter.CAPTIONS_AREA_ID, "\">\n        <div class=\"subtitleWindow\" data-id=\"").concat(SamsungAdapter.CAPTIONS_WINDOW_ID, "\"></div>\n      </div>\n    </div>");
    return SamsungAdapter;
}(PlayerEventEmitter_1.PlayerEventEmitter));
exports.default = SamsungAdapter;
//# sourceMappingURL=samsung.js.map