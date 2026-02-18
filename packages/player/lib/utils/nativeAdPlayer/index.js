"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var adEvent_1 = require("@tubitv/analytics/lib/adEvent");
var androidAdPlayer_1 = tslib_1.__importDefault(require("../../androidAdPlayer"));
// import MockNativeAdBridge from './MockNativeAdBridge';
var constants_1 = require("../../constants");
var adTools_1 = require("../adTools");
var progressiveMp4AdPlayer_1 = tslib_1.__importDefault(require("../progressiveMp4AdPlayer"));
var tools_1 = require("../tools");
var NativeAdPlayer = /** @class */ (function (_super) {
    tslib_1.__extends(NativeAdPlayer, _super);
    function NativeAdPlayer(options) {
        var _this = _super.call(this, options) || this;
        // Current ad position and duration for tracking
        _this.currentAdPosition = 0;
        _this.currentADTimeProgressed = false;
        _this.isAdBuffering = false;
        _this.onAdReady = function () {
            _this.log('onAdReady');
            var _a = _this, adSequence = _a.adSequence, adCount = _a.adCount, isPreroll = _a.isPreroll;
            _this.emit(constants_1.PLAYER_EVENTS.adCanPlay);
            _this.stopBuffering(constants_1.StopBufferingReason.el_canplay_event);
            _this.emit(constants_1.PLAYER_EVENTS.adReady, { adSequence: adSequence, adCount: adCount, isPreroll: isPreroll });
        };
        _this.onBufferStart = function () {
            _this.startBuffering(constants_1.StartBufferingReason.el_waiting_event);
        };
        _this.onAdPlaying = function (eventData) {
            // here is temporary fix of eventData index will be undefined in the first AdPlay event
            if (_this.state === 'playing' || typeof eventData.index !== 'number') {
                return;
            }
            _this.log('onAdPlaying');
            _this.setState('playing');
            _this.emit(constants_1.PLAYER_EVENTS.adPlaying);
            _this.onAdPlay(eventData);
        };
        _this.onAdTimeupdate = function (eventData) {
            if (!_this.androidAdPlayer) {
                return;
            }
            var currentAd = _this.adList[eventData.index];
            var position = _this.currentAdPosition;
            _this.log('onTimeupdate', position);
            _this.stopBuffering(constants_1.StopBufferingReason.el_timeupdate_event_1);
            if (!_this.currentADTimeProgressed && position > constants_1.CURRENT_TIME_PROGRESSED_THRESHOLD) {
                _this.currentADTimeProgressed = true;
                _this.emit(constants_1.PLAYER_EVENTS.adCurrentTimeProgressed, {
                    isPreroll: _this.isPreroll,
                });
            }
            _this.currentAdPosition = eventData.position / 1000;
            var currentAdDuration = eventData.duration / 1000;
            _this.adTrack(_this.currentAdPosition);
            _this.emit(constants_1.PLAYER_EVENTS.adTime, {
                position: _this.currentAdPosition,
                duration: currentAdDuration,
                sequence: _this.adSequence,
                podcount: _this.adCount,
                remainingPodDuration: _this.remainingAdPodDuration,
            });
            if (currentAd && !currentAd.state.videoStarted && position !== 0) {
                currentAd.state.videoStarted = true;
            }
            if (currentAd && position !== 0 && currentAd.state.videoStarted && !currentAd.state.adStartFired) {
                _this.onAdPlaying(eventData);
            }
        };
        _this.onAdPause = function () {
            _this.stopBuffering(constants_1.StopBufferingReason.el_pause_event);
            _this.log('onAdPause');
            _this.setState('paused');
            _this.emit(constants_1.PLAYER_EVENTS.adPause);
        };
        _this.onAdPlay = function (eventData) {
            var currentAd = _this.adList[eventData.index];
            if (!currentAd) {
                return;
            }
            _this.emit(constants_1.PLAYER_EVENTS.adPlay);
            if (currentAd.state.adStartFired) {
                return;
            }
            _this.adSequence += 1;
            if (currentAd && _this.remainingAdPodDuration) {
                _this.remainingAdPodDuration -= currentAd.duration;
            }
            var _a = _this, adSequence = _a.adSequence, adCount = _a.adCount, isPreroll = _a.isPreroll;
            _this.emit(constants_1.PLAYER_EVENTS.adStart, {
                ad: currentAd,
                adSequence: adSequence,
                adsCount: adCount,
                adPosition: 0,
                isPreroll: isPreroll,
                isPAL: !!currentAd.icon,
                adType: _this.getAdType(),
                consecutiveCodeSkips: 0,
            });
            currentAd.state.adStartFired = true;
        };
        _this.onAdEnded = function (eventData) {
            var _a = _this, adCount = _a.adCount, adSequence = _a.adSequence, isPreroll = _a.isPreroll;
            var currentAdIndex = eventData.index;
            _this.tryFixCorrectAdSequence(currentAdIndex);
            _this.setState('completed');
            var currentAd = _this.getCurrentAdWithState();
            var nextAd = _this.adList[_this.adSequence];
            _this.adTrack(constants_1.END_AD_TRACK_POSITION);
            if (currentAd) {
                _this.markAdAsSuccess(currentAd);
                _this.emit(constants_1.PLAYER_EVENTS.adComplete, {
                    ad: currentAd,
                    adsCount: adCount,
                    adSequence: adSequence,
                    adPosition: _this.getAdPosition(),
                    isPreroll: isPreroll,
                    isPAL: !!currentAd.icon,
                    adType: _this.getAdType(),
                    consecutiveCodeSkips: 0,
                    totalDurationExcludePause: 0,
                    totalDurationIncludePause: 0,
                });
            }
            if (nextAd) {
                _this.emit(constants_1.PLAYER_EVENTS.adStartLoad, {
                    isPreroll: isPreroll,
                });
                var trackAdErrorHandler = function (err) {
                    _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, err, {
                        id: nextAd.id,
                        type: 'impression',
                    });
                };
                _this.adTrackFn = (0, adTools_1.getAdTrackFn)(nextAd, {
                    errorHandler: trackAdErrorHandler,
                    useQueueImpressions: false,
                });
            }
            else {
                _this.onAdPodComplete();
            }
        };
        _this.onAdSkip = function (eventData) {
            var currentAdIndex = eventData.index;
            _this.tryFixCorrectAdSequence(currentAdIndex);
            var ad = _this.getCurrentAdWithState();
            var discontinueReason = 'native skip';
            _this.handleAdDisconnect(discontinueReason, ad);
            if (_this.adSequence >= _this.adList.length) {
                _this.onAdPodComplete();
            }
        };
        _this.onAdPodComplete = function () {
            var adPodDuration = (0, adTools_1.getAdPodDuration)(_this.adList);
            _this.emit(constants_1.PLAYER_EVENTS.adPodComplete, {
                count: _this.adCount,
                successCount: _this.getSuccessAdsCount(),
                failureCount: _this.getFailedAdsCount(),
                duration: adPodDuration,
                totalDurationIncludePause: 0,
                totalDurationExcludePause: 0,
                isPreroll: _this.isPreroll,
            });
            _this.remove();
        };
        _this.onAdError = function (errorData) {
            var err = new Error((errorData === null || errorData === void 0 ? void 0 : errorData.message) || 'Unknown error');
            _this.log('onError', err);
            var ad = _this.getCurrentAdWithState();
            if (ad) {
                _this.emit(constants_1.PLAYER_EVENTS.adError, err, tslib_1.__assign(tslib_1.__assign({}, _this.getAdErrorEventData(ad)), { adType: _this.getAdType() }));
            }
            _this.skipError(err, ad);
        };
        _this.options = options;
        _this.log = options.debug ? (0, tools_1.debug)('NativeAdPlayer') : function () { };
        // this.bridge = new MockNativeAdBridge();
        _this.bridge = options.bridge;
        _this.androidAdPlayer = new androidAdPlayer_1.default({
            debug: options.debug,
            bridge: _this.bridge,
            ads: [],
        });
        return _this;
    }
    NativeAdPlayer.prototype.attachNativeEvent = function () {
        this.log('Native event received:', event);
        this.androidAdPlayer.on(constants_1.PLAYER_EVENTS.canPlay, this.onAdReady);
        this.androidAdPlayer.on(constants_1.PLAYER_EVENTS.bufferStart, this.onBufferStart);
        this.androidAdPlayer.on(constants_1.PLAYER_EVENTS.play, this.onAdPlaying);
        this.androidAdPlayer.on(constants_1.PLAYER_EVENTS.pause, this.onAdPause);
        this.androidAdPlayer.on(constants_1.PLAYER_EVENTS.time, this.onAdTimeupdate);
        this.androidAdPlayer.on(constants_1.PLAYER_EVENTS.complete, this.onAdEnded);
        this.androidAdPlayer.on(constants_1.PLAYER_EVENTS.error, this.onAdError);
        this.androidAdPlayer.on(constants_1.PLAYER_EVENTS.nativeAdsSkip, this.onAdSkip);
    };
    NativeAdPlayer.prototype.detachNativeEvent = function () {
        this.androidAdPlayer.off(constants_1.PLAYER_EVENTS.canPlay, this.onAdReady);
        this.androidAdPlayer.off(constants_1.PLAYER_EVENTS.bufferStart, this.onBufferStart);
        this.androidAdPlayer.off(constants_1.PLAYER_EVENTS.play, this.onAdPlaying);
        this.androidAdPlayer.off(constants_1.PLAYER_EVENTS.pause, this.onAdPause);
        this.androidAdPlayer.off(constants_1.PLAYER_EVENTS.time, this.onAdTimeupdate);
        this.androidAdPlayer.off(constants_1.PLAYER_EVENTS.complete, this.onAdEnded);
        this.androidAdPlayer.off(constants_1.PLAYER_EVENTS.error, this.onAdError);
        this.androidAdPlayer.off(constants_1.PLAYER_EVENTS.nativeAdsSkip, this.onAdSkip);
    };
    NativeAdPlayer.prototype.getAdType = function () {
        return adEvent_1.AdType.NATIVE;
    };
    /**
     * Preload ad response - preload ads for midroll without starting playback
     * This is used when ads_mode = 2 (preload feature enabled)
     */
    NativeAdPlayer.prototype.preloadAdResponse = function (adResponse) {
        this.log('preloadAdResponse', adResponse);
        // Transform ad response and send to native player for preloading
        this.adList = adResponse.map(function (ad) { return (tslib_1.__assign(tslib_1.__assign({}, ad), { state: {
                played: false,
                finished: false,
                failed: false,
                adStartFired: false,
                videoStarted: false,
                startTime: 0,
                pauseDuration: 0,
                consecutiveCodeSkips: 0,
                stallRetryCount: 0,
                healthScoreRetryCount: 0,
                healthScoreSeekCount: 0,
                isPreloaded: true,
            } })); });
        this.adSequence = 0;
        this.adCount = adResponse.length;
        this.androidAdPlayer.updateCurrentAdSequence(adResponse);
        this.androidAdPlayer.preloadAds();
    };
    /**
     * Check if ads are preloaded
     */
    NativeAdPlayer.prototype.isAdsPreloaded = function () {
        var _a, _b;
        return this.androidAdPlayer.areAdsPreloaded() && !!((_b = (_a = this.adList[0]) === null || _a === void 0 ? void 0 : _a.state) === null || _b === void 0 ? void 0 : _b.isPreloaded);
    };
    /**
     * Play ad response - override to setup native player
     */
    NativeAdPlayer.prototype.playAdResponse = function (adResponse) {
        this.log('playAdResponse', adResponse, 'isPreloaded:', this.isAdsPreloaded());
        // Check if ads are already preloaded
        if (this.isAdsPreloaded()) {
            this.setupNativePlayer(adResponse);
            return;
        }
        // we keep the ads list like parent to help to report and state manage
        this.adList = adResponse.map(function (ad) { return (tslib_1.__assign(tslib_1.__assign({}, ad), { state: {
                played: false,
                finished: false,
                failed: false,
                adStartFired: false,
                videoStarted: false,
                startTime: 0,
                pauseDuration: 0,
                consecutiveCodeSkips: 0,
                stallRetryCount: 0,
                healthScoreRetryCount: 0,
                healthScoreSeekCount: 0,
            } })); });
        this.adSequence = 0;
        this.adCount = adResponse.length;
        this.setupNativePlayer(adResponse);
    };
    NativeAdPlayer.prototype.setupNativePlayer = function (adResponse) {
        var _this = this;
        this.attachNativeEvent();
        // first set the source
        this.androidAdPlayer.updateCurrentAdSequence(adResponse);
        this.remainingAdPodDuration = (0, adTools_1.getAdPodDuration)(adResponse);
        var currentAd = this.adList[this.adSequence];
        var trackAdErrorHandler = function (err) {
            _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, err, {
                id: currentAd.id,
                type: 'impression',
            });
        };
        this.adTrackFn = (0, adTools_1.getAdTrackFn)(currentAd, {
            errorHandler: trackAdErrorHandler,
            useQueueImpressions: false,
        });
        this.androidAdPlayer.setupPlayer({
            volume: this.options.volume || 100,
            autoplay: true,
            needCountdown: true,
            // fixed option for first run to collect the logs
            enableHealthScore: true,
            healthScoreThreshold: 0,
            healthScoreCheckInterval: 5000,
        }).then(function () {
            _this.log('Native player setup completed');
            _this.emit(constants_1.PLAYER_EVENTS.adStartLoad, {
                isPreroll: _this.isPreroll,
            });
        }).catch(function (err) {
            _this.log('Native player setup failed', err);
            _this.emit(constants_1.PLAYER_EVENTS.adPlayerSetupError, err);
        });
    };
    NativeAdPlayer.prototype.play = function () {
        this.androidAdPlayer.play();
    };
    NativeAdPlayer.prototype.pause = function () {
        this.androidAdPlayer.pause();
    };
    /**
     * Override to return undefined since native player doesn't expose video element
     */
    NativeAdPlayer.prototype.getVideoElement = function () {
        return undefined;
    };
    NativeAdPlayer.prototype.remove = function () {
        if (this.state === 'destroyed')
            return;
        this.setState('destroyed');
        // Destroy native player
        this.detachNativeEvent();
        this.androidAdPlayer.remove();
    };
    NativeAdPlayer.prototype.getCurrentAd = function () {
        var adWithState = this.getCurrentAdWithState();
        if (adWithState) {
            var state = adWithState.state, rest = tslib_1.__rest(adWithState, ["state"]);
            return rest;
        }
    };
    NativeAdPlayer.prototype.getAdList = function () {
        return this.adList.map(function (_a) {
            var state = _a.state, rest = tslib_1.__rest(_a, ["state"]);
            return rest;
        });
    };
    NativeAdPlayer.prototype.getLagTime = function () {
        return -1; // Native player doesn't expose lag time
    };
    NativeAdPlayer.prototype.isAdEnded = function () {
        return this.state === 'completed';
    };
    NativeAdPlayer.prototype.startBuffering = function (reason) {
        if (this.isAdBuffering)
            return;
        this.isAdBuffering = true;
        this.emit(constants_1.PLAYER_EVENTS.adBufferStart, {
            reason: reason,
            currentTime: this.currentAdPosition,
        });
    };
    NativeAdPlayer.prototype.stopBuffering = function (reason) {
        if (!this.isAdBuffering)
            return;
        this.isAdBuffering = false;
        this.emit(constants_1.PLAYER_EVENTS.adBufferEnd, {
            reason: reason,
            currentTime: this.currentAdPosition,
        });
    };
    NativeAdPlayer.prototype.tryFixCorrectAdSequence = function (currentAdIndex) {
        if (this.adSequence - 1 < currentAdIndex) {
            this.adSequence = currentAdIndex + 1;
        }
    };
    NativeAdPlayer.prototype.setVolume = function (volume) {
        this.androidAdPlayer.setVolume(volume);
    };
    // We don't have the data in AdNativePlayer
    NativeAdPlayer.prototype.getBufferedRange = function () {
        return []; // Native player doesn't expose buffered ranges
    };
    NativeAdPlayer.prototype.getAdPosition = function () {
        return this.currentAdPosition;
    };
    NativeAdPlayer.prototype.skipError = function (error, ad) {
        // We only report the data; The native will auto skip
        var discontinueReason = error.message || constants_1.PLAYER_EVENTS.adError;
        this.handleAdDisconnect(discontinueReason, ad);
        if (ad && !ad.state.adStartFired) {
            this.adSequence++;
        }
        if (this.adSequence >= this.adList.length) {
            this.onAdPodComplete();
        }
    };
    NativeAdPlayer.prototype.handleAdDisconnect = function (reason, ad) {
        if (ad) {
            var adDiscontinueEvent = tslib_1.__assign(tslib_1.__assign({}, this.getAdErrorEventData(ad)), { reason: reason, adStartFired: ad.state.adStartFired, videoPaused: false, videoStarted: ad.state.videoStarted, consecutiveCodeSkips: 0 });
            this.emit(constants_1.PLAYER_EVENTS.adDiscontinue, adDiscontinueEvent);
        }
    };
    return NativeAdPlayer;
}(progressiveMp4AdPlayer_1.default));
exports.default = NativeAdPlayer;
//# sourceMappingURL=index.js.map