"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var localStorage_1 = require("@adrise/utils/lib/localStorage");
var time_1 = require("@adrise/utils/lib/time");
var adEvent_1 = require("@tubitv/analytics/lib/adEvent");
var adHealthChecker_1 = require("./adHealthChecker");
var AdStallManager_1 = require("./AdStallManager");
var adTools_1 = require("./adTools");
var dom_1 = require("./dom");
var performanceCollector_1 = require("./performanceCollector");
var PlayerEventEmitter_1 = require("./PlayerEventEmitter");
var tools_1 = require("./tools");
var constants_1 = require("../constants");
var types_1 = require("../types");
var NO_BUFFER_MAX_RETRY = 1;
var ProgressiveMp4AdPlayer = /** @class */ (function (_super) {
    tslib_1.__extends(ProgressiveMp4AdPlayer, _super);
    function ProgressiveMp4AdPlayer(options) {
        var _this = this;
        var _a;
        _this = _super.call(this) || this;
        _this.state = 'idle';
        _this.isBuffering = false;
        _this.adList = [];
        _this.detachClickThrough = function () { };
        _this.currentTimeProgressed = false;
        _this.pauseDuration = 0;
        _this.enableAdBlockedCheck = false;
        _this.onEnterPictureInPicture = function () {
            // eslint-disable-next-line compat/compat
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
        _this.createAdHealthChecker = function (videoElement) {
            var _a;
            (_a = _this.adHealthChecker) === null || _a === void 0 ? void 0 : _a.destroy();
            _this.adHealthChecker = new adHealthChecker_1.AdPlaybackHealthChecker(videoElement, {
                onHealthScoreLow: _this.onHealthScoreLow,
                healthThreshold: 0.6,
            });
            _this.adHealthChecker.start();
        };
        _this.onHealthScoreLow = function (score) {
            var currentAd = _this.getCurrentAdWithState();
            if (!currentAd) {
                return;
            }
            if (currentAd && _this.options.skipAdWithHealthScore !== "only_error" /* AD_HEALTH_OPTIONS.CONTROL */) {
                _this.skipBrokenAd({ code: constants_1.PLAYER_EVENTS.adHealthScoreLow, message: "".concat(constants_1.PLAYER_EVENTS.adHealthScoreLow, "_").concat(score) }, currentAd);
            }
            _this.emit(constants_1.PLAYER_EVENTS.adHealthScoreLow, {
                ad: currentAd,
                healthScore: score,
            });
        };
        _this.onLoadeddata = function () {
            _this.log('onLoadeddata');
            var _a = _this, adSequence = _a.adSequence, adCount = _a.adCount, isPreroll = _a.isPreroll;
            if (_this.enableAdBlockedCheck) {
                _this.resetAdRequestBlocked();
            }
            var currentAd = _this.getCurrentAdWithState();
            if (!currentAd) {
                return;
            }
            _this.emit(constants_1.PLAYER_EVENTS.adStart, {
                ad: currentAd,
                adSequence: adSequence,
                adsCount: adCount,
                adPosition: 0,
                isPreroll: isPreroll,
                isPAL: !!currentAd.icon,
                adType: _this.getAdType(),
            });
            currentAd.state.adStartFired = true;
            if (!_this.isPreroll || _this.autoStart) {
                // Auto start ad playback
                _this.play();
            }
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
            var adStallData = tslib_1.__assign({ adSequence: _this.adSequence, adsCount: _this.adCount, adPosition: _this.getAdPosition(), isPreroll: _this.isPreroll }, data);
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
                _this.emit(constants_1.PLAYER_EVENTS.adCurrentTimeProgressed);
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
            var _a, _b;
            _this.log('onEnded');
            var _c = _this, adCount = _c.adCount, adSequence = _c.adSequence, isPreroll = _c.isPreroll;
            _this.stopBuffering(constants_1.StopBufferingReason.el_ended_event);
            _this.setState('completed');
            // Make sure that 100 percent tracking happens
            _this.adTrack(Number.POSITIVE_INFINITY);
            var ad = _this.getCurrentAdWithState();
            var scores = (_a = _this.adHealthChecker) === null || _a === void 0 ? void 0 : _a.scores;
            (_b = _this.adHealthChecker) === null || _b === void 0 ? void 0 : _b.destroy();
            _this.adHealthChecker = undefined;
            if (ad) {
                _this.markAdAsSuccess(ad);
                _this.emit(constants_1.PLAYER_EVENTS.adComplete, {
                    ad: ad,
                    adsCount: adCount,
                    adSequence: adSequence,
                    adPosition: _this.getAdPosition(),
                    isPreroll: isPreroll,
                    isPAL: !!ad.icon,
                    healthScores: scores,
                    adType: _this.getAdType(),
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
            if (_this.options.ignorePlayInterruptErrorInAd && err.code === DOMException.ABORT_ERR) {
                return;
            }
            _this.skipBrokenAd(err, ad);
        };
        _this.trackVASTError = function (error) {
            if (!error || (error instanceof Error))
                return;
            var ad = _this.getCurrentAdWithState();
            if (!ad) {
                return;
            }
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
            (0, adTools_1.sendVASTErrorBeacon)(ad, errorCode, function (err) {
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
        _this.getNoBufferTimeout = function () {
            var _a;
            return (_a = _this.options.adNoBufferTimeout) !== null && _a !== void 0 ? _a : 10000;
        };
        _this.skipNoBufferAd = function (ad) {
            _this.skipBrokenAd({ code: constants_1.PLAYER_EVENTS.adNoBuffer, message: constants_1.PLAYER_EVENTS.adNoBuffer }, ad);
        };
        _this.retryNoBufferAd = function (ad) {
            /* istanbul ignore next */
            if (!_this.videoElement)
                return;
            if (ad.state.retry < NO_BUFFER_MAX_RETRY) {
                ad.state.retry++;
                _this.setVideoElementSrcForAd(_this.videoElement, ad.video);
                _this.videoElement.load();
                _this.startAdNoBufferDetection(ad);
            }
            else {
                _this.skipNoBufferAd(ad);
            }
        };
        if (options.reuseVideoElement && !options.videoElement) {
            throw new Error('`videoElement` must be specified if `reuseVideoElement` is true.');
        }
        _this.options = options;
        _this.autoStart = options.autoStart === undefined ? true : options.autoStart;
        _this.log = options.debug ? (0, tools_1.debug)('AdPlayer') : function () { };
        _this.isPreroll = options.isPreroll;
        _this.enableAdBlockedCheck = (_a = options.enableAdBlockedCheck) !== null && _a !== void 0 ? _a : false;
        return _this;
    }
    /**
     * Play ad response
     */
    ProgressiveMp4AdPlayer.prototype.playAdResponse = function (adResponse) {
        this.log('playAdResponse action', adResponse);
        this.adList = adResponse.map(function (ad) { return (tslib_1.__assign(tslib_1.__assign({}, ad), { state: {
                retry: 0,
                played: false,
                finished: false,
                failed: false,
                adStartFired: false,
                videoStarted: false,
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
        if (!this.autoStart)
            this.autoStart = true;
        if (typeof this.pauseStartTimestamp !== 'undefined') {
            this.pauseDuration += ((0, time_1.timeDiffInMilliseconds)(this.pauseStartTimestamp, (0, time_1.now)()));
            delete this.pauseStartTimestamp;
        }
        (0, dom_1.safeVideoElementPlay)(this.videoElement, this.onError);
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
    ProgressiveMp4AdPlayer.prototype.beforeRemove = function () {
        var currentAd = this.getCurrentAdWithState();
        if (currentAd && !currentAd.state.finished && !currentAd.state.videoStarted && currentAd.state.played) {
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
        (_b = this.adStallManager) === null || _b === void 0 ? void 0 : _b.destroy();
        this.adNoBufferDetectionTimer && clearTimeout(this.adNoBufferDetectionTimer);
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
        var _a = this.options, container = _a.container, reuseVideoElement = _a.reuseVideoElement, videoElement = _a.videoElement, volume = _a.volume;
        this.container = container;
        if (reuseVideoElement) {
            if (!videoElement) {
                throw new Error('video element must be defined to reuseVideoElement');
            }
            this.videoElement = videoElement;
        }
        else {
            this.videoElement = document.createElement('video');
            this.videoElement.style.zIndex = "".concat(Number.POSITIVE_INFINITY);
            container.appendChild(this.videoElement);
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
    ProgressiveMp4AdPlayer.prototype.playNextAd = function () {
        var _this = this;
        var _a, _b, _c, _d;
        clearTimeout(this.adNoBufferDetectionTimer);
        var previousAd = this.getCurrentAdWithState();
        if (previousAd && this.remainingPodDuration) {
            this.remainingPodDuration -= previousAd.duration;
        }
        (_a = this.adHealthChecker) === null || _a === void 0 ? void 0 : _a.destroy();
        this.adHealthChecker = undefined;
        this.adSequence++;
        (_b = this.performanceCollector) === null || _b === void 0 ? void 0 : _b.destroy();
        var currentAd = this.getCurrentAdWithState();
        if (!currentAd) {
            (_c = this.adStallManager) === null || _c === void 0 ? void 0 : _c.destroy();
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
        this.createAdHealthChecker(this.videoElement);
        this.adTrackFn = (0, adTools_1.getAdTrackFn)(currentAd, function (err) {
            _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, err, {
                id: currentAd.id,
                type: 'impression',
            });
        }, this.options.useQueueImpressions);
        var adUrl = currentAd.video;
        if (this.options.performanceCollectorEnabled) {
            this.performanceCollector = new performanceCollector_1.PerformanceCollector({
                debug: this.options.debug,
                reporter: function (metrics) { return _this.emit(constants_1.PLAYER_EVENTS.startupPerformance, {
                    isAd: true,
                    ad: currentAd,
                    adSequence: _this.adSequence,
                    adsCount: _this.adCount,
                    isPreroll: _this.isPreroll,
                    metrics: metrics,
                }); },
            });
            this.performanceCollector.setVideoElement(this.videoElement);
        }
        this.emit(constants_1.PLAYER_EVENTS.adStartLoad);
        this.currentTimeProgressed = false;
        currentAd.state.startTime = (0, time_1.now)();
        this.setVideoElementSrcForAd(this.videoElement, adUrl);
        if (this.options.loadBetweenAds) {
            this.videoElement.load();
        }
        if (this.options.clickThroughEnabled
            && currentAd.clickthrough
            && ((_d = currentAd.clicktracking) === null || _d === void 0 ? void 0 : _d.length)) {
            this.detachClickThrough();
            this.detachClickThrough = this.attachClickThrough(currentAd.clickthrough, currentAd.clicktracking);
        }
        if (currentAd.icon) {
            this.emit(constants_1.PLAYER_EVENTS.adIconVisible, currentAd.icon);
        }
        this.markAdAsPlayed(currentAd);
        this.startAdNoBufferDetection(currentAd);
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
    ProgressiveMp4AdPlayer.prototype.getAdType = function () {
        return this.options.playerName === types_1.PlayerName.AD ? adEvent_1.AdType.WRAPPER : undefined;
    };
    ProgressiveMp4AdPlayer.prototype.adTrack = function (position) {
        var _a, _b;
        var adQuartile = (_b = (_a = this.adTrackFn) === null || _a === void 0 ? void 0 : _a.call(this, position)) !== null && _b !== void 0 ? _b : -1;
        if (adQuartile >= 0) {
            this.emit(constants_1.PLAYER_EVENTS.adQuartile, adQuartile);
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
        return {
            ad: ad,
            adSequence: this.adSequence,
            adsCount: this.adCount,
            adPosition: this.getAdPosition(),
            isPreroll: this.isPreroll,
            isPAL: !!ad.icon,
            // We only want to collect the lagTime of the ad didn't start playing
            lagTime: !ad.state.videoStarted && ad.state.startTime ? (0, time_1.timeDiffInMilliseconds)(ad.state.startTime, (0, time_1.now)()) : -1,
        };
    };
    ProgressiveMp4AdPlayer.prototype.skipBrokenAd = function (error, currentAd) {
        if (currentAd) {
            this.emitAdDiscontinueEvent(currentAd, error === null || error === void 0 ? void 0 : error.message);
            this.trackVASTError(error);
            this.markAdAsFailed(currentAd, error === null || error === void 0 ? void 0 : error.message);
        }
        if (this.options.abnormalErrorConstrainView && this.isAllAdsRequestBlocked())
            return;
        this.playNextAd();
    };
    ProgressiveMp4AdPlayer.prototype.emitAdDiscontinueEvent = function (ad, reason) {
        if (reason === void 0) { reason = constants_1.PLAYER_EVENTS.adError; }
        var adDiscontinueEvent = tslib_1.__assign(tslib_1.__assign({}, this.getAdErrorEventData(ad)), { reason: reason, adStartFired: ad.state.adStartFired, videoStarted: ad.state.videoStarted });
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
    ProgressiveMp4AdPlayer.prototype.startAdNoBufferDetection = function (ad) {
        var _this = this;
        var adNoBufferMethod = this.options.adNoBufferMethod;
        var timeout = this.getNoBufferTimeout();
        clearTimeout(this.adNoBufferDetectionTimer);
        this.adNoBufferDetectionTimer = window.setTimeout(function () {
            /* istanbul ignore next */
            if (!_this.videoElement)
                return;
            if ((0, tools_1.isEmptyBuffer)(_this.videoElement)) {
                _this.emit(constants_1.PLAYER_EVENTS.adNoBuffer, {
                    ad: ad,
                    adSequence: _this.adSequence,
                    adsCount: _this.adCount,
                    adPosition: _this.getAdPosition(),
                    elReadyState: _this.getVideoElementState(),
                    isPreroll: _this.isPreroll,
                    timeout: timeout,
                });
                switch (adNoBufferMethod) {
                    case 'skip':
                        _this.skipNoBufferAd(ad);
                        break;
                    case 'retry':
                        _this.retryNoBufferAd(ad);
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