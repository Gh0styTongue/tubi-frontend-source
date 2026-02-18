"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var localStorage_1 = require("@adrise/utils/lib/localStorage");
var time_1 = require("@adrise/utils/lib/time");
var adEvent_1 = require("@tubitv/analytics/lib/adEvent");
var adEndChecker_1 = require("./adEndChecker");
var adHealthChecker_1 = require("./adHealthChecker");
var AdStallManager_1 = require("./AdStallManager");
var adTools_1 = require("./adTools");
var dom_1 = require("./dom");
var performanceCollector_1 = require("./performanceCollector");
var PlayerEventEmitter_1 = require("./PlayerEventEmitter");
var tools_1 = require("./tools");
var constants_1 = require("../constants");
var types_1 = require("../types");
var ProgressiveMp4AdPlayer = /** @class */ (function (_super) {
    tslib_1.__extends(ProgressiveMp4AdPlayer, _super);
    function ProgressiveMp4AdPlayer(options) {
        var _a;
        var _this = _super.call(this) || this;
        _this.state = 'idle';
        _this.isBuffering = false;
        _this.adList = [];
        // Sequence of the current ad, 1-based indexing
        _this.adSequence = 0;
        // Count of ads in this cue point, 1-based indexing
        _this.adCount = 0;
        _this.detachClickThrough = function () { };
        _this.currentTimeProgressed = false;
        _this.pauseDuration = 0;
        _this.enableAdBlockedCheck = false;
        _this.pendingPlayPromises = 0;
        _this.impressionsActivated = true;
        _this.onEnterPictureInPicture = function () {
            document.exitPictureInPicture();
        };
        _this.createAdStallManager = function (ad, videoElement) {
            var _a;
            (_a = _this.adStallManager) === null || _a === void 0 ? void 0 : _a.destroy();
            _this.adStallManager = new AdStallManager_1.AdStallManager({
                videoElement: videoElement,
                onAdStallDetected: _this.onAdStallDetected,
                ad: ad,
            });
        };
        _this.createAdEndChecker = function (ad, videoElement) {
            _this.destroyAdEndChecker();
            _this.adEndChecker = new adEndChecker_1.AdEndChecker();
            _this.adEndChecker.start(videoElement, function () {
                if (!_this.options.endAdsNearEnd) {
                    return;
                }
                try {
                    _this.onEnded();
                }
                catch (e) {
                    _this.skipBrokenAd(true, e, ad);
                }
            });
        };
        _this.createAdHealthChecker = function (videoElement) {
            _this.destroyAdHealthChecker();
            _this.adHealthChecker = new adHealthChecker_1.AdPlaybackHealthChecker(videoElement, {
                healthThreshold: _this.options.healthScoreThreshold,
                onHealthScoreCheck: _this.onHealthScoreCheck,
            });
            _this.adHealthChecker.start();
        };
        _this.onHealthScoreCheck = function (scores, isHealthScoreLow) {
            var currentAd = _this.getCurrentAdWithState();
            if (!currentAd || !_this.videoElement) {
                return;
            }
            var isEstimatedTimeCostHigh = scores.estimatedTimeCost && _this.videoElement.duration > 0
                ? scores.estimatedTimeCost > (_this.options.maxEstimatedTimeCostMultiplier || 2) * _this.videoElement.duration
                : false;
            var skipAd = _this.shouldSkipAdWithHealthScore(scores, isHealthScoreLow, isEstimatedTimeCostHigh);
            var reason = isEstimatedTimeCostHigh ? 'estimatedTimeCost' : 'healthscoreLow';
            if (isEstimatedTimeCostHigh || isHealthScoreLow) {
                _this.emit(constants_1.PLAYER_EVENTS.adHealthScoreLow, {
                    ad: currentAd,
                    healthScore: scores.total,
                    scores: scores,
                    skipAd: skipAd,
                    currentTime: _this.videoElement.currentTime,
                    duration: _this.videoElement.duration,
                    reason: reason,
                });
            }
            if (skipAd) {
                _this.skipBrokenAd(true, { code: reason, message: reason }, currentAd);
            }
        };
        _this.startAd = function () {
            var _a = _this, adSequence = _a.adSequence, adCount = _a.adCount, isPreroll = _a.isPreroll;
            if (_this.enableAdBlockedCheck) {
                _this.resetAdRequestBlocked();
            }
            var currentAd = _this.getCurrentAdWithState();
            if (!currentAd) {
                return;
            }
            if (!currentAd.state.adStartFired) {
                _this.emit(constants_1.PLAYER_EVENTS.adStart, {
                    ad: currentAd,
                    adSequence: adSequence,
                    adsCount: adCount,
                    adPosition: 0,
                    isPreroll: isPreroll,
                    isPAL: !!currentAd.icon,
                    adType: _this.getAdType(),
                    consecutiveCodeSkips: currentAd.state.consecutiveCodeSkips,
                    lastSkipReason: currentAd.state.lastSkipReason,
                });
                currentAd.state.adStartFired = true;
            }
            if (!_this.isPreroll || _this.autoStart) {
                // Auto start ad playback
                _this.play();
            }
        };
        _this.onLoadeddata = function () {
            _this.log('onLoadeddata');
            var _a = _this, adSequence = _a.adSequence, adCount = _a.adCount, isPreroll = _a.isPreroll;
            _this.emit(constants_1.PLAYER_EVENTS.adReady, { adSequence: adSequence, adCount: adCount, isPreroll: isPreroll });
            _this.startAd();
        };
        _this.onLoadStart = function () {
            _this.log('onLoadStart', _this.state);
            _this.setState('idle');
            _this.startBuffering(constants_1.StartBufferingReason.el_load_start);
        };
        _this.onWaiting = function () {
            _this.log('onWaiting', _this.state);
            // Don't emit "buffer" event if state is "complete"
            if (_this.getState() !== 'completed') {
                _this.startBuffering(constants_1.StartBufferingReason.el_waiting_event);
            }
        };
        _this.onCanPlay = function () {
            _this.log('onCanPlay', _this.state);
            _this.emit(constants_1.PLAYER_EVENTS.adCanPlay);
            _this.stopBuffering(constants_1.StopBufferingReason.el_canplay_event);
        };
        _this.onAdStallDetected = function (data) {
            var adStallData = tslib_1.__assign(tslib_1.__assign(tslib_1.__assign({}, _this.getBaseAdData()), { adPosition: _this.getAdPosition() }), data);
            _this.emit(constants_1.PLAYER_EVENTS.adStall, adStallData);
        };
        _this.onTimeupdate = function () {
            if (!_this.videoElement) {
                return;
            }
            var currentAd = _this.getCurrentAdWithState();
            var position = _this.videoElement.currentTime;
            _this.log('onTimeupdate', position);
            _this.stopBuffering(constants_1.StopBufferingReason.el_timeupdate_event_1);
            _this.adTrack(position);
            if (!_this.currentTimeProgressed && position > constants_1.CURRENT_TIME_PROGRESSED_THRESHOLD) {
                _this.currentTimeProgressed = true;
                _this.emit(constants_1.PLAYER_EVENTS.adCurrentTimeProgressed, {
                    isPreroll: _this.isPreroll,
                });
            }
            _this.emit(constants_1.PLAYER_EVENTS.adTime, {
                position: position,
                duration: _this.videoElement.duration || 0,
                sequence: _this.adSequence,
                podcount: _this.adCount,
                remainingPodDuration: _this.remainingPodDuration,
            });
            if (currentAd
                && !currentAd.state.videoStarted
                && position !== 0) {
                currentAd.state.videoStarted = true;
            }
        };
        _this.onPlay = function () {
            _this.log('onPlay');
            _this.stopBuffering(constants_1.StopBufferingReason.el_play_event);
            _this.emit(constants_1.PLAYER_EVENTS.adPlay);
        };
        _this.onPlaying = function () {
            _this.log('onPlaying');
            _this.setState('playing');
            _this.emit(constants_1.PLAYER_EVENTS.adPlaying);
        };
        _this.onPause = function () {
            _this.stopBuffering(constants_1.StopBufferingReason.el_pause_event);
            _this.log('onPause');
            _this.setState('paused');
            _this.emit(constants_1.PLAYER_EVENTS.adPause);
        };
        _this.onEnded = function () {
            var _a;
            _this.log('onEnded');
            var _b = _this, adCount = _b.adCount, adSequence = _b.adSequence, isPreroll = _b.isPreroll;
            _this.stopBuffering(constants_1.StopBufferingReason.el_ended_event);
            _this.setState('completed');
            // Make sure that 100 percent tracking happens
            _this.adTrack(constants_1.END_AD_TRACK_POSITION);
            var ad = _this.getCurrentAdWithState();
            var scores = (_a = _this.adHealthChecker) === null || _a === void 0 ? void 0 : _a.getScores();
            _this.destroyAdEndChecker();
            _this.destroyAdHealthChecker();
            if (ad) {
                _this.markAdAsSuccess(ad);
                var adStartLoadTimestamp = ad.state.startTime;
                _this.emit(constants_1.PLAYER_EVENTS.adComplete, {
                    ad: ad,
                    adsCount: adCount,
                    adSequence: adSequence,
                    adPosition: _this.getAdPosition(),
                    isPreroll: isPreroll,
                    isPAL: !!ad.icon,
                    healthScores: scores,
                    adType: _this.getAdType(),
                    consecutiveCodeSkips: ad.state.consecutiveCodeSkips,
                    lastSkipReason: ad.state.lastSkipReason,
                    totalDurationIncludePause: (0, time_1.timeDiffInMilliseconds)(adStartLoadTimestamp, (0, time_1.now)()),
                    totalDurationExcludePause: (0, time_1.timeDiffInMilliseconds)(adStartLoadTimestamp, (0, time_1.now)()) - ad.state.pauseDuration,
                });
            }
            _this.playNextAd();
        };
        _this.onError = function (error) {
            var _a, _b;
            var err = (error && !(error instanceof Event))
                ? error
                : (_b = (_a = _this.videoElement) === null || _a === void 0 ? void 0 : _a.error) !== null && _b !== void 0 ? _b : {
                    message: 'null',
                    code: 'null',
                };
            _this.log('onError', err);
            _this.setState('errored');
            if (_this.enableAdBlockedCheck) {
                if (err.message === constants_1.AD_REQUEST_BLOCKED_ERROR.message) {
                    ProgressiveMp4AdPlayer.adRequestBlocked.countInOnePod++;
                    ProgressiveMp4AdPlayer.adRequestBlocked.continuousCount++;
                }
                else {
                    _this.resetAdRequestBlocked();
                }
            }
            var ad = _this.getCurrentAdWithState();
            if (ad) {
                _this.emit(constants_1.PLAYER_EVENTS.adError, err, tslib_1.__assign(tslib_1.__assign({}, _this.getAdErrorEventData(ad)), (_this.isAllAdsRequestBlocked() ? { isConstrainView: _this.options.abnormalErrorConstrainView } : {})));
            }
            _this.skipBrokenAd(false, err, ad);
        };
        _this.trackVASTError = function (ad, error) {
            if (!error || (error instanceof Error))
                return;
            var errorCode = '';
            switch (error.code) {
                case 1: // MediaError.MEDIA_ERR_ABORTED
                case 2: // MediaError.MEDIA_ERR_NETWORK
                    errorCode = constants_1.VAST_ERROR_CODE.MEDIA_FILE_TIMEOUT;
                    break;
                case 3: // MediaError.MEDIA_ERR_DECODE
                    errorCode = constants_1.VAST_ERROR_CODE.MEDIA_FORMAT_NOT_SUPPORT;
                    break;
                case 4: // MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
                    errorCode = constants_1.VAST_ERROR_CODE.MEDIA_DECODE_ERROR;
                    break;
                default:
                    errorCode = constants_1.VAST_ERROR_CODE.MEDIA_PLAYER_ERROR;
                    break;
            }
            (0, adTools_1.sendVASTErrorBeacon)(ad.error, errorCode, function (err) {
                _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, err, {
                    id: ad.id,
                    type: 'error',
                });
            });
        };
        _this.getVideoElementState = function () {
            var _a, _b;
            /* istanbul ignore next */
            return (_b = (_a = _this.videoElement) === null || _a === void 0 ? void 0 : _a.readyState) !== null && _b !== void 0 ? _b : -1;
        };
        _this.getAdStallAtStartCheckTimeout = function () {
            var _a;
            return (_a = _this.options.adStallAtStartCheckTimeout) !== null && _a !== void 0 ? _a : 10000;
        };
        _this.isPlayHeadNotMoveAfterLoaded = function (ad) {
            return !ad.state.videoStarted
                && ad.state.adStartFired
                && _this.getState() === 'idle';
        };
        _this.isAdStallAtStart = function (ad, timeout) {
            /* istanbul ignore next */
            if (!_this.videoElement)
                return;
            var stallReason;
            if ((0, tools_1.isEmptyBuffer)(_this.videoElement)) {
                stallReason = constants_1.AD_STALL_AT_START_REASON.AD_NO_BUFFER;
            }
            if (_this.isPlayHeadNotMoveAfterLoaded(ad)) {
                stallReason = constants_1.AD_STALL_AT_START_REASON.AD_PLAYHEAD_NOT_MOVING;
            }
            if (stallReason) {
                _this.emit(constants_1.PLAYER_EVENTS.adStallAtStart, tslib_1.__assign(tslib_1.__assign({}, _this.getStallAtData(ad, _this.videoElement)), { reason: stallReason, timeout: timeout }));
                return stallReason;
            }
        };
        _this.retryStallAd = function (ad, stallReason) {
            /* istanbul ignore next */
            if (!_this.videoElement)
                return;
            if (ad.state.stallRetryCount < constants_1.AD_STALL_AT_START_MAX_RETRY) {
                ad.state.stallRetryCount++;
                _this.retry(ad);
                _this.startAdStallAtStartDetection(ad);
            }
            else {
                _this.skipBrokenAd(!_this.options.disableAdStallSkipImpressionRequirement, { code: stallReason, message: stallReason }, ad);
            }
        };
        _this.retry = function (ad) {
            if (!_this.videoElement)
                return;
            _this.setVideoElementSrcForAd(_this.videoElement, ad.video);
            _this.videoElement.load();
        };
        if (options.reuseVideoElement && !options.videoElement) {
            throw new Error('`videoElement` must be specified if `reuseVideoElement` is true.');
        }
        _this.options = options;
        _this.autoStart = options.autoStart === undefined ? true : options.autoStart;
        _this.log = options.debug ? (0, tools_1.debug)('AdPlayer') : function () { };
        _this.isPreroll = options.isPreroll;
        _this.enableAdBlockedCheck = (_a = options.enableAdBlockedCheck) !== null && _a !== void 0 ? _a : false;
        _this.container = options.container;
        _this.impressionsActivated = !options.deferImpressionUntilActivated;
        return _this;
    }
    /**
     * Play ad response
     */
    ProgressiveMp4AdPlayer.prototype.playAdResponse = function (adResponse) {
        this.log('playAdResponse action', adResponse);
        this.adList = adResponse.map(function (ad) { return (tslib_1.__assign(tslib_1.__assign({}, ad), { state: {
                played: false,
                finished: false,
                failed: false,
                adStartFired: false,
                videoStarted: false,
                consecutiveCodeSkips: 0,
                stallRetryCount: 0,
                healthScoreRetryCount: 0,
                healthScoreSeekCount: 0,
                pauseDuration: 0,
                startTime: 0,
            } })); });
        this.remainingPodDuration = (0, adTools_1.getAdPodDuration)(adResponse);
        this.adSequence = 0;
        this.adCount = adResponse.length;
        this.pauseDuration = 0;
        ProgressiveMp4AdPlayer.adRequestBlocked.countInOnePod = 0;
        if (this.adCount === 0) {
            this.emit(constants_1.PLAYER_EVENTS.adPodEmpty, {
                isPreroll: this.isPreroll,
            });
            return;
        }
        this.adPodStartTimestamp = (0, time_1.now)();
        this.setup();
        // Note: awaiting this.playNextAd() prevents ads from initially playing and requires a user gesture
        // on Comcast devices. The reason is unknown for now
        this.playNextAd();
    };
    /**
     * Resume the current ad playback.
     */
    ProgressiveMp4AdPlayer.prototype.play = function () {
        var _this = this;
        if (!this.autoStart)
            this.autoStart = true;
        var currentAd = this.getCurrentAdWithState();
        if (typeof this.pauseStartTimestamp !== 'undefined') {
            var pauseDuration = (0, time_1.timeDiffInMilliseconds)(this.pauseStartTimestamp, (0, time_1.now)());
            if (currentAd) {
                currentAd.state.pauseDuration += pauseDuration;
            }
            this.pauseDuration += pauseDuration;
            delete this.pauseStartTimestamp;
        }
        var adSequence = this.getAdSequence();
        var retryCount = currentAd === null || currentAd === void 0 ? void 0 : currentAd.state.stallRetryCount;
        if (!this.videoElement) {
            return;
        }
        this.pendingPlayPromises++;
        (0, dom_1.safeVideoElementPlay)(this.videoElement).then(function () {
            _this.pendingPlayPromises--;
        }).catch(function (error) {
            var _a, _b, _c;
            _this.pendingPlayPromises--;
            // this promise could reject when something else is using the video.
            // only send along the error if not removed and still erroring for the
            // current ad.
            if (_this.getState() === 'destroyed' || // player has been destroyed
                adSequence !== _this.getAdSequence() || // playing next ad
                retryCount !== ((_a = _this.getCurrentAdWithState()) === null || _a === void 0 ? void 0 : _a.state.stallRetryCount) // retrying current ad
            ) {
                if ((_c = (_b = _this.options).ignorePlayInterruptErrorInAd) === null || _c === void 0 ? void 0 : _c.call(_b)) {
                    return;
                }
            }
            _this.onError(error);
        });
    };
    /**
     * Pause the current ad playback.
     */
    ProgressiveMp4AdPlayer.prototype.pause = function () {
        if (this.videoElement === undefined) {
            return;
        }
        this.videoElement.pause();
        this.pauseStartTimestamp = (0, time_1.now)();
    };
    /**
     * Get ad player state.
     */
    ProgressiveMp4AdPlayer.prototype.getState = function () {
        return this.state;
    };
    /**
     * Get the url of the current Ad
     */
    ProgressiveMp4AdPlayer.prototype.getAdUrl = function () {
        var _a;
        return (_a = this.getCurrentAdWithState()) === null || _a === void 0 ? void 0 : _a.video;
    };
    ProgressiveMp4AdPlayer.prototype.getIsBuffering = function () {
        return this.isBuffering;
    };
    ProgressiveMp4AdPlayer.prototype.getVideoElement = function () {
        return this.videoElement;
    };
    ProgressiveMp4AdPlayer.prototype.beforeRemove = function (forceTrigger) {
        if (forceTrigger === void 0) { forceTrigger = false; }
        var currentAd = this.getCurrentAdWithState();
        if (currentAd && ((!currentAd.state.finished && !currentAd.state.videoStarted && currentAd.state.played) || forceTrigger)) {
            this.emitAdDiscontinueEvent(currentAd, constants_1.PLAYER_EVENTS.remove);
        }
    };
    ProgressiveMp4AdPlayer.prototype.removeVideoElement = function () {
        if (!this.options.reuseVideoElement && this.videoElement) {
            (0, dom_1.removeVideoElement)(this.videoElement);
            this.videoElement = undefined;
        }
    };
    /**
     * Destroy the ad player.
     */
    ProgressiveMp4AdPlayer.prototype.remove = function () {
        var _a, _b;
        if (this.state === 'destroyed')
            return;
        this.stopBuffering(constants_1.StopBufferingReason.adplayer_exit);
        this.setState('destroyed');
        (_a = this.detachEvents) === null || _a === void 0 ? void 0 : _a.call(this);
        this.destroyAdEndChecker();
        this.destroyAdHealthChecker();
        (_b = this.adStallManager) === null || _b === void 0 ? void 0 : _b.destroy();
        this.adStallAtStartDetectionTimer && clearTimeout(this.adStallAtStartDetectionTimer);
        this.detachClickThrough();
        this.removeVideoElement();
    };
    /**
     * Update ad player state.
     */
    ProgressiveMp4AdPlayer.prototype.setState = function (state) {
        this.state = state;
    };
    ProgressiveMp4AdPlayer.prototype.setup = function () {
        var _a = this.options, reuseVideoElement = _a.reuseVideoElement, videoElement = _a.videoElement, volume = _a.volume;
        if (reuseVideoElement) {
            if (!videoElement) {
                throw new Error('video element must be defined to reuseVideoElement');
            }
            this.videoElement = videoElement;
        }
        else {
            // Check if container already has a video element
            var existingVideoElement = this.container.querySelector('video');
            if (existingVideoElement) {
                this.videoElement = existingVideoElement;
                this.videoElement.style.zIndex = "".concat(Number.POSITIVE_INFINITY);
            }
            else {
                this.videoElement = document.createElement('video');
                this.videoElement.style.zIndex = "".concat(Number.POSITIVE_INFINITY);
                this.container.appendChild(this.videoElement);
            }
        }
        this.videoElement.type = 'video/mp4';
        this.detachEvents = this.attachEvents(this.videoElement);
        this.setState('inited');
        if (volume !== undefined) {
            this.setVolume(volume);
        }
    };
    ProgressiveMp4AdPlayer.prototype.attachEvents = function (videoElement) {
        var handlers = {
            loadeddata: this.onLoadeddata,
            loadstart: this.onLoadStart,
            waiting: this.onWaiting,
            canplay: this.onCanPlay,
            timeupdate: this.onTimeupdate,
            play: this.onPlay,
            playing: this.onPlaying,
            pause: this.onPause,
            ended: this.onEnded,
            error: this.onError,
            enterpictureinpicture: this.onEnterPictureInPicture,
        };
        for (var _i = 0, _a = Object.entries(handlers); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            videoElement.addEventListener(key, value);
        }
        return function () {
            for (var _i = 0, _a = Object.entries(handlers); _i < _a.length; _i++) {
                var _b = _a[_i], key = _b[0], value = _b[1];
                videoElement.removeEventListener(key, value);
            }
        };
    };
    ProgressiveMp4AdPlayer.prototype.attachClickThrough = function (clickthrough, clicktracking) {
        var _this = this;
        var handler = function () {
            _this.emit(constants_1.PLAYER_EVENTS.adClick, clickthrough);
            (0, tools_1.sendBeaconRequest)(clicktracking);
            window.open(clickthrough);
        };
        this.container.addEventListener('click', handler);
        var originalCursor = this.container.style.cursor;
        this.container.style.cursor = 'pointer';
        return function () {
            _this.container.removeEventListener('click', handler);
            _this.container.style.cursor = originalCursor || 'initial';
        };
    };
    ProgressiveMp4AdPlayer.prototype.shouldSkipAdWithHealthScore = function (scores, isHealthScoreLow, isEstimatedTimeCostHigh) {
        if (scores.checkCount < 2) {
            // Don't skip ad if not enough data to make a decision
            return false;
        }
        // R1 strategy: Skip when health score is low
        var shouldSkipWhenHealthscoreIsLow = this.options.skipAdWithHealthScore !== undefined && this.options.skipAdWithHealthScore !== "only_error" /* AD_HEALTH_OPTIONS.CONTROL */ && !this.options.skipAdWithHealthScoreR2;
        // R2 strategy: Skip when estimated time cost is high
        var shouldSkipWhenEstimatedTimeCostIsHigh = !!this.options.skipAdWithHealthScoreR2;
        return (shouldSkipWhenHealthscoreIsLow && isHealthScoreLow) || (shouldSkipWhenEstimatedTimeCostIsHigh && isEstimatedTimeCostHigh);
    };
    ProgressiveMp4AdPlayer.prototype.shouldUseQueueImpressions = function () {
        return this.options.useQueueImpressions;
    };
    ProgressiveMp4AdPlayer.prototype.playNextAd = function () {
        var _this = this;
        var _a, _b, _c;
        clearTimeout(this.adStallAtStartDetectionTimer);
        var previousAd = this.getCurrentAdWithState();
        if (previousAd && this.remainingPodDuration) {
            this.remainingPodDuration -= previousAd.duration;
        }
        this.destroyAdEndChecker();
        this.destroyAdHealthChecker();
        this.adSequence++;
        (_a = this.performanceCollector) === null || _a === void 0 ? void 0 : _a.destroy();
        var currentAd = this.getCurrentAdWithState();
        if (!currentAd) {
            (_b = this.adStallManager) === null || _b === void 0 ? void 0 : _b.destroy();
            this.adStallManager = undefined;
            this.remainingPodDuration = undefined;
            var adPodDuration = (0, adTools_1.getAdPodDuration)(this.adList);
            this.emit(constants_1.PLAYER_EVENTS.adPodComplete, {
                count: this.adCount,
                successCount: this.getSuccessAdsCount(),
                failureCount: this.getFailedAdsCount(),
                duration: adPodDuration,
                totalDurationIncludePause: (0, time_1.timeDiffInMilliseconds)(this.adPodStartTimestamp, (0, time_1.now)()),
                totalDurationExcludePause: (0, time_1.timeDiffInMilliseconds)(this.adPodStartTimestamp, (0, time_1.now)()) - this.pauseDuration,
                isPreroll: this.isPreroll,
            });
            return;
        }
        if (!this.videoElement) {
            this.log('videoElement not defined during playNextAd');
            return;
        }
        this.createAdStallManager(currentAd, this.videoElement);
        this.createAdEndChecker(currentAd, this.videoElement);
        this.createAdHealthChecker(this.videoElement);
        var trackAdErrorHandler = function (err) {
            _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, err, {
                id: currentAd.id,
                type: 'impression',
            });
        };
        this.adTrackFn = (0, adTools_1.getAdTrackFn)(currentAd, {
            errorHandler: trackAdErrorHandler,
            useQueueImpressions: this.shouldUseQueueImpressions(),
        });
        var adUrl = currentAd.video;
        if (this.options.performanceCollectorEnabled) {
            this.performanceCollector = new performanceCollector_1.PerformanceCollector({
                debug: this.options.debug,
                reporter: function (metrics) { return _this.emit(constants_1.PLAYER_EVENTS.startupPerformance, tslib_1.__assign(tslib_1.__assign({}, _this.getBaseAdData()), { isAd: true, ad: currentAd, metrics: metrics })); },
            });
            this.performanceCollector.setVideoElement(this.videoElement);
        }
        this.emit(constants_1.PLAYER_EVENTS.adStartLoad, {
            isPreroll: this.isPreroll,
        });
        this.currentTimeProgressed = false;
        currentAd.state.startTime = (0, time_1.now)();
        currentAd.state.pauseDuration = 0;
        this.setVideoElementSrcForAd(this.videoElement, adUrl);
        if (this.options.loadBetweenAds) {
            this.videoElement.load();
        }
        if (this.options.clickThroughEnabled
            && currentAd.clickthrough
            && ((_c = currentAd.clicktracking) === null || _c === void 0 ? void 0 : _c.length)) {
            this.detachClickThrough();
            this.detachClickThrough = this.attachClickThrough(currentAd.clickthrough, currentAd.clicktracking);
        }
        if (currentAd.icon) {
            this.emit(constants_1.PLAYER_EVENTS.adIconVisible, currentAd.icon);
        }
        this.markAdAsPlayed(currentAd);
        this.startAdStallAtStartDetection(currentAd);
    };
    ProgressiveMp4AdPlayer.prototype.getCurrentAdWithState = function () {
        return this.adList[this.adSequence - 1];
    };
    ProgressiveMp4AdPlayer.prototype.getCurrentAd = function () {
        var adWithState = this.getCurrentAdWithState();
        if (adWithState) {
            var state = adWithState.state, rest = tslib_1.__rest(adWithState, ["state"]);
            return rest;
        }
    };
    ProgressiveMp4AdPlayer.prototype.getNextAdWithState = function () {
        return this.adList[this.adSequence];
    };
    ProgressiveMp4AdPlayer.prototype.getNextAd = function () {
        var adWithState = this.getNextAdWithState();
        if (adWithState) {
            var state = adWithState.state, rest = tslib_1.__rest(adWithState, ["state"]);
            return rest;
        }
    };
    ProgressiveMp4AdPlayer.prototype.getAdList = function () {
        return this.adList.map(function (_a) {
            var state = _a.state, rest = tslib_1.__rest(_a, ["state"]);
            return rest;
        });
    };
    ProgressiveMp4AdPlayer.prototype.getAdSequence = function () {
        return this.adSequence;
    };
    ProgressiveMp4AdPlayer.prototype.getLagTime = function () {
        var _a;
        return ((_a = this.adStallManager) === null || _a === void 0 ? void 0 : _a.lagTime) || -1;
    };
    ProgressiveMp4AdPlayer.prototype.isAdEnded = function () {
        var _a, _b;
        return (_b = (_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.ended) !== null && _b !== void 0 ? _b : false;
    };
    ProgressiveMp4AdPlayer.prototype.startBuffering = function (reason) {
        var _a;
        if (this.isBuffering)
            return;
        this.isBuffering = true;
        this.emit(constants_1.PLAYER_EVENTS.adBufferStart, {
            reason: reason,
            currentTime: (_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.currentTime,
        });
    };
    ProgressiveMp4AdPlayer.prototype.stopBuffering = function (reason) {
        var _a;
        if (!this.isBuffering)
            return;
        this.isBuffering = false;
        this.emit(constants_1.PLAYER_EVENTS.adBufferEnd, {
            reason: reason,
            currentTime: (_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.currentTime,
        });
    };
    ProgressiveMp4AdPlayer.prototype.getBaseAdData = function () {
        return {
            adSequence: this.adSequence,
            adsCount: this.adCount,
            isPreroll: this.isPreroll,
        };
    };
    ProgressiveMp4AdPlayer.prototype.setVolume = function (volume) {
        if (!this.videoElement) {
            return;
        }
        this.videoElement.volume = volume / 100;
    };
    /**
     * The buffered range from the video element itself
     */
    ProgressiveMp4AdPlayer.prototype.getBufferedRange = function () {
        var _a;
        return (0, tools_1.transBufferedRangesIntoArray)((_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.buffered);
    };
    /**
     * Get the current ad playback position, in seconds
     */
    ProgressiveMp4AdPlayer.prototype.getAdPosition = function () {
        var _a;
        return (_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.currentTime;
    };
    /**
     * Get the current playing ad duration, in seconds
     */
    ProgressiveMp4AdPlayer.prototype.getAdDuration = function () {
        var _a;
        return (_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.duration;
    };
    ProgressiveMp4AdPlayer.prototype.destroyAdEndChecker = function () {
        if (this.adEndChecker) {
            this.adEndChecker.destroy();
            this.adEndChecker = undefined;
        }
    };
    ProgressiveMp4AdPlayer.prototype.destroyAdHealthChecker = function () {
        if (this.adHealthChecker) {
            this.adHealthChecker.destroy();
            this.adHealthChecker = undefined;
        }
    };
    ProgressiveMp4AdPlayer.prototype.getAdType = function () {
        return this.options.playerName === types_1.PlayerName.AD ? adEvent_1.AdType.WRAPPER : undefined;
    };
    ProgressiveMp4AdPlayer.prototype.adTrack = function (position) {
        var _a, _b;
        var condition = this.validateAdTrackTiming(position);
        if (!condition.isValid) {
            var _c = this, adSequence = _c.adSequence, adCount = _c.adCount, isPreroll = _c.isPreroll;
            var currentAd = this.getCurrentAdWithState();
            if (currentAd) {
                this.emit(constants_1.PLAYER_EVENTS.falseImpression, {
                    ad: currentAd,
                    adSequence: adSequence,
                    adsCount: adCount,
                    adPosition: 0,
                    isPreroll: isPreroll,
                    isPAL: !!currentAd.icon,
                    adType: this.getAdType(),
                });
            }
        }
        if (condition.shouldBlock) {
            return;
        }
        // Skip tracking if impressions are deferred and not yet activated
        if (!this.impressionsActivated) {
            return;
        }
        var adQuartile = (_b = (_a = this.adTrackFn) === null || _a === void 0 ? void 0 : _a.call(this, position)) !== null && _b !== void 0 ? _b : -1;
        if (adQuartile >= 0) {
            this.emit(constants_1.PLAYER_EVENTS.adQuartile, adQuartile);
        }
    };
    ProgressiveMp4AdPlayer.prototype.validateAdTrackTiming = function (position) {
        var _a = this.options, impressionRequirement = _a.impressionRequirement, onlyRespectImpressionRequirementAfterCodeSkip = _a.onlyRespectImpressionRequirementAfterCodeSkip;
        var currentAd = this.getCurrentAdWithState();
        if (position === 0) {
            var isLastAdBeenSkippedWithNoBuffer = (currentAd === null || currentAd === void 0 ? void 0 : currentAd.state.lastSkipReason) === constants_1.AD_STALL_AT_START_REASON.AD_NO_BUFFER;
            return {
                isValid: false,
                shouldBlock: isLastAdBeenSkippedWithNoBuffer
                    || (impressionRequirement === 'non_zero' && (!onlyRespectImpressionRequirementAfterCodeSkip || !!(currentAd === null || currentAd === void 0 ? void 0 : currentAd.state.consecutiveCodeSkips))),
            };
        }
        return { isValid: true, shouldBlock: false };
    };
    /**
     * Activate ad impressions. Call this when the player becomes visible in prerender scenarios.
     * This will allow impressions to be sent for the current and subsequent ads.
     */
    ProgressiveMp4AdPlayer.prototype.activateImpressions = function () {
        var _a;
        if (this.impressionsActivated) {
            return;
        }
        this.impressionsActivated = true;
        // Immediately send impression for the current ad if it's playing
        var position = this.getAdPosition();
        if (position !== undefined && position > 0) {
            (_a = this.adTrackFn) === null || _a === void 0 ? void 0 : _a.call(this, position);
        }
    };
    ProgressiveMp4AdPlayer.prototype.markAdAsPlayed = function (ad) {
        ad.state.played = true;
    };
    ProgressiveMp4AdPlayer.prototype.markAdAsFailed = function (ad, reason) {
        ad.state.failed = true;
        ad.state.failedReason = reason;
    };
    ProgressiveMp4AdPlayer.prototype.markAdAsSuccess = function (ad) {
        ad.state.finished = true;
    };
    ProgressiveMp4AdPlayer.prototype.getSuccessAdsCount = function () {
        return this.adList.filter(function (ad) { return ad.state.finished && ad.state.played; }).length;
    };
    ProgressiveMp4AdPlayer.prototype.getFailedAdsCount = function () {
        return this.adList.filter(function (ad) { return ad.state.failed && ad.state.played; }).length;
    };
    ProgressiveMp4AdPlayer.prototype.getAdErrorEventData = function (ad) {
        return tslib_1.__assign(tslib_1.__assign({}, this.getBaseAdData()), { ad: ad, adPosition: this.getAdPosition(), isPAL: !!ad.icon, autoStart: this.autoStart, 
            // We only want to collect the lagTime if the ad didn't start playing
            lagTime: !ad.state.videoStarted && ad.state.startTime ? (0, time_1.timeDiffInMilliseconds)(ad.state.startTime, (0, time_1.now)()) : -1 });
    };
    ProgressiveMp4AdPlayer.prototype.skipBrokenAd = function (isCodeSkip, error, currentAd) {
        var discontinueReason = error === null || error === void 0 ? void 0 : error.message;
        if (currentAd) {
            this.emitAdDiscontinueEvent(currentAd, discontinueReason);
            this.trackVASTError(currentAd, error);
            this.markAdAsFailed(currentAd, discontinueReason);
        }
        if (this.options.abnormalErrorConstrainView && this.isAllAdsRequestBlocked())
            return;
        var nextAdState = this.getNextAdWithState();
        if (nextAdState) {
            if (isCodeSkip) {
                if (!currentAd || currentAd.state.lastSkipReason !== discontinueReason) {
                    nextAdState.state.consecutiveCodeSkips = 1;
                }
                else {
                    nextAdState.state.consecutiveCodeSkips = currentAd.state.consecutiveCodeSkips + 1;
                }
            }
            nextAdState.state.lastSkipReason = discontinueReason;
        }
        this.playNextAd();
    };
    ProgressiveMp4AdPlayer.prototype.emitAdDiscontinueEvent = function (ad, reason) {
        var _a;
        if (reason === void 0) { reason = constants_1.PLAYER_EVENTS.adError; }
        var adDiscontinueEvent = tslib_1.__assign(tslib_1.__assign({}, this.getAdErrorEventData(ad)), { reason: reason, adStartFired: ad.state.adStartFired, videoPaused: !!this.pauseStartTimestamp, videoStarted: ad.state.videoStarted, consecutiveCodeSkips: ad.state.consecutiveCodeSkips, lastSkipReason: ad.state.lastSkipReason, healthScores: (_a = this.adHealthChecker) === null || _a === void 0 ? void 0 : _a.getScores(), bufferedArray: this.getBufferedRange(), pendingPlay: this.pendingPlayPromises });
        this.emit(constants_1.PLAYER_EVENTS.adDiscontinue, adDiscontinueEvent);
    };
    ProgressiveMp4AdPlayer.prototype.isAllAdsRequestBlocked = function () {
        if (this.enableAdBlockedCheck && this.adCount > 0
            && ProgressiveMp4AdPlayer.adRequestBlocked.countInOnePod === this.adCount
            && (ProgressiveMp4AdPlayer.adRequestBlocked.continuousCount > constants_1.MAX_AD_REQUEST_BLOCKED_CONTINUOUS_COUNT
                || (0, localStorage_1.getLocalStorageData)(constants_1.PLAYER_STORAGE_ADS_REQUEST_BLOCKED))) {
            (0, localStorage_1.setLocalStorageData)(constants_1.PLAYER_STORAGE_ADS_REQUEST_BLOCKED, 'true');
            return true;
        }
        return false;
    };
    ProgressiveMp4AdPlayer.prototype.resetAdRequestBlocked = function () {
        ProgressiveMp4AdPlayer.adRequestBlocked.continuousCount = 0;
        (0, localStorage_1.removeLocalStorageData)(constants_1.PLAYER_STORAGE_ADS_REQUEST_BLOCKED);
    };
    ProgressiveMp4AdPlayer.prototype.getStallAtData = function (ad, videoElement) {
        return tslib_1.__assign(tslib_1.__assign({}, this.getBaseAdData()), { ad: ad, adPosition: this.getAdPosition(), elReadyState: this.getVideoElementState(), elPauseState: videoElement.paused });
    };
    ProgressiveMp4AdPlayer.prototype.startAdStallAtStartDetection = function (ad) {
        var _this = this;
        var adStallAtStartHandleMethod = this.options.adStallAtStartHandleMethod;
        var timeout = this.getAdStallAtStartCheckTimeout();
        clearTimeout(this.adStallAtStartDetectionTimer);
        this.adStallAtStartDetectionTimer = window.setTimeout(function () {
            var stallReason = _this.isAdStallAtStart(ad, timeout);
            // Only handle no buffer for now in rerunning no buffer ads exp.
            // We will come back for other reasons later.
            if (stallReason === constants_1.AD_STALL_AT_START_REASON.AD_NO_BUFFER) {
                switch (adStallAtStartHandleMethod) {
                    case 'skip':
                        _this.skipBrokenAd(!_this.options.disableAdStallSkipImpressionRequirement, { code: stallReason, message: stallReason }, ad);
                        break;
                    case 'retry':
                        _this.retryStallAd(ad, stallReason);
                        break;
                    default:
                        break;
                }
            }
        }, timeout);
    };
    ProgressiveMp4AdPlayer.prototype.setVideoElementSrcForAd = function (videoElement, adUrl) {
        if ((0, dom_1.isSamsung2015)()) {
            adUrl = adUrl.replace(/^https/, 'http');
        }
        videoElement.src = adUrl;
    };
    ProgressiveMp4AdPlayer.adRequestBlocked = {
        countInOnePod: 0,
        continuousCount: 0,
    };
    return ProgressiveMp4AdPlayer;
}(PlayerEventEmitter_1.PlayerEventEmitter));
exports.default = ProgressiveMp4AdPlayer;
//# sourceMappingURL=progressiveMp4AdPlayer.js.map