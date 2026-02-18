"use strict";
/**
 * This is a mini player that is used to play simple mp4 file, such as campaign ads.
 * The player would autostart while calling `load()` by default, and you can set `autoStart` to `false` to disable it.
 * Here is a usage example:
 * ```
 useEffect(() => {
    const media = buildAdQueue({ items: [creative] })[0];
    player = new CampaignAdPlayer({
      container: playerContainerRef.current,
      debug: !FeatureSwitchManager.isDefault(['Logging', 'Player']),
    });
    playerRef.current.on(PLAYER_EVENTS.complete, onComplete);
    playerRef.current.on(PLAYER_EVENTS.play, onPlay);
    playerRef.current.on(PLAYER_EVENTS.error, onError);
    playerRef.current.load(media);
    return () => {
      player.off(PLAYER_EVENTS.complete, onComplete);
      player.off(PLAYER_EVENTS.play, onPlay);
      player.off(PLAYER_EVENTS.error, onError);
      player.remove();
    };
  }, [onComplete, onPlay, onError]);
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var constants_1 = require("./constants");
var adEndChecker_1 = require("./utils/adEndChecker");
var adTools_1 = require("./utils/adTools");
var dom_1 = require("./utils/dom");
var PlayerEventEmitter_1 = require("./utils/PlayerEventEmitter");
var tools_1 = require("./utils/tools");
var CampaignAdPlayer = /** @class */ (function (_super) {
    tslib_1.__extends(CampaignAdPlayer, _super);
    function CampaignAdPlayer(options) {
        /* istanbul ignore next */
        var _this = _super.call(this) || this;
        _this.detachClickThrough = function () { };
        _this.autoStart = true;
        _this.startAfterCanPlayThrough = false;
        _this.impDelaySec = 0;
        _this.isStarted = false;
        _this.isImpressionFired = false;
        _this.timeUpdateCount = 0;
        _this.isTimeEventEmittedTwice = false;
        _this.canPlayEmitted = false;
        // Some devices won't download the mp4 and show the first frame if we don't manually call play() even if we set preload to auto.
        // Call play then pause immediately could force it to download the mp4
        _this.onCanPlay = function () {
            _this.log('onCanPlay, isStarted', _this.isStarted);
            _this.canPlayEmitted = true;
            _this.emit(constants_1.PLAYER_EVENTS.canPlay);
            var video = _this.videoElement;
            var previousMuted = video ? video.muted : false;
            if (video && !_this.isStarted) {
                // temporarily mute during preheat to avoid audible blips
                video.muted = true;
            }
            _this.safeVideoElementPlay().then(function () {
                if (_this.autoStart && !_this.startAfterCanPlayThrough) {
                    _this.isStarted = true;
                }
                if (!_this.isStarted) {
                    _this.pause();
                }
                if (video) {
                    // restore original mute state after preheat or start
                    video.muted = previousMuted;
                }
            });
        };
        _this.onCanPlayThrough = function () {
            _this.log('onCanPlayThrough, isStarted', _this.isStarted);
            _this.emit(constants_1.PLAYER_EVENTS.canPlayThrough);
            if (_this.isStarted) {
                return;
            }
            if (_this.autoStart && _this.startAfterCanPlayThrough) {
                _this.play();
            }
        };
        _this.createAdEndChecker = function (videoElement) {
            _this.destroyAdEndChecker();
            _this.adEndChecker = new adEndChecker_1.AdEndChecker();
            _this.adEndChecker.start(videoElement, function () {
                _this.onEnded();
            });
        };
        _this.onTimeupdate = function () {
            var _a;
            if (!_this.videoElement) {
                return;
            }
            var _b = _this.videoElement, currentTime = _b.currentTime, duration = _b.duration;
            _this.log('onTimeupdate', currentTime);
            (_a = _this.trackFn) === null || _a === void 0 ? void 0 : _a.call(_this, currentTime, duration);
            if (currentTime >= _this.impDelaySec && !_this.isImpressionFired) {
                _this.isImpressionFired = true;
                _this.emit(constants_1.PLAYER_EVENTS.adImpressionFired);
            }
            if (!_this.isTimeEventEmittedTwice) {
                _this.timeUpdateCount++;
                if (_this.timeUpdateCount > 1) {
                    _this.isTimeEventEmittedTwice = true;
                    _this.emit(constants_1.PLAYER_EVENTS.timeEventEmittedTwice);
                }
            }
            _this.emit(constants_1.PLAYER_EVENTS.time, {
                position: currentTime,
                duration: duration,
            });
        };
        _this.onPlaying = function () {
            _this.log('onPlaying');
            _this.emit(constants_1.PLAYER_EVENTS.play);
        };
        _this.onPause = function () {
            _this.log('onPause');
            _this.emit(constants_1.PLAYER_EVENTS.pause);
        };
        _this.onEnded = function () {
            var _a;
            if (!_this.videoElement) {
                return;
            }
            _this.log('onEnded');
            (_a = _this.trackFn) === null || _a === void 0 ? void 0 : _a.call(_this, constants_1.END_AD_TRACK_POSITION, _this.videoElement.duration);
            _this.emit(constants_1.PLAYER_EVENTS.complete);
        };
        _this.onPlayRejected = function () {
            _this.log('onPlayRejected');
            _this.emit(constants_1.PLAYER_EVENTS.error, {
                type: constants_1.ErrorType.MEDIA_ERROR,
                errorSource: constants_1.ERROR_SOURCE.NATIVE_ERROR,
                fatal: false,
                error: new Error(constants_1.PLAY_REJECTED_ERROR),
            });
        };
        _this.onError = function () {
            var _a;
            /* istanbul ignore next */
            var err = (_a = _this.videoElement) === null || _a === void 0 ? void 0 : _a.error;
            if (!err) {
                return;
            }
            _this.log('onError', err);
            _this.emit(constants_1.PLAYER_EVENTS.error, {
                type: constants_1.ErrorType.MEDIA_ERROR,
                errorSource: constants_1.ERROR_SOURCE.NATIVE_ERROR,
                error: err,
                fatal: true,
            });
            _this.trackVASTError(err);
        };
        _this.trackVASTError = function (error) {
            if (!error || (error instanceof Error) || !_this.media)
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
            var media = _this.media;
            (0, adTools_1.sendVASTErrorBeacon)(media, errorCode, function (err) {
                _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, err, {
                    id: media.id,
                    type: 'error',
                });
            });
        };
        _this.options = options;
        _this.log = options.debug ? (0, tools_1.debug)('CampaignAdPlayer') : function () { };
        _this.container = options.container;
        _this.setup();
        return _this;
    }
    CampaignAdPlayer.prototype.safeVideoElementPlay = function () {
        var _a, _b, _c, _d;
        this.log('innerPlay, this.isStarted', this.isStarted, 'this.canPlayEmitted', this.canPlayEmitted, 'this.videoElement?.paused', (_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.paused, 'this.videoElement?.ended', (_b = this.videoElement) === null || _b === void 0 ? void 0 : _b.ended);
        if (!this.canPlayEmitted
            || (!((_c = this.videoElement) === null || _c === void 0 ? void 0 : _c.paused) && !((_d = this.videoElement) === null || _d === void 0 ? void 0 : _d.ended))) {
            return Promise.resolve();
        }
        return (0, dom_1.safeVideoElementPlay)(this.videoElement).catch(this.onPlayRejected);
    };
    CampaignAdPlayer.prototype.play = function () {
        this.log('play', this.isStarted);
        this.isStarted = true;
        return this.safeVideoElementPlay();
    };
    CampaignAdPlayer.prototype.pause = function () {
        var _a;
        this.log('pause');
        (_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.pause();
    };
    CampaignAdPlayer.prototype.getVideoElement = function () {
        return this.videoElement;
    };
    CampaignAdPlayer.prototype.removeVideoElement = function () {
        if (this.videoElement) {
            (0, dom_1.removeVideoElement)(this.videoElement);
            this.videoElement = undefined;
        }
    };
    CampaignAdPlayer.prototype.remove = function () {
        var _a;
        (_a = this.detachEvents) === null || _a === void 0 ? void 0 : _a.call(this);
        this.destroyAdEndChecker();
        this.detachClickThrough();
        this.removeAllListeners();
        this.removeVideoElement();
    };
    CampaignAdPlayer.prototype.setup = function () {
        this.log('setup', this.options);
        var poster = this.options.poster;
        this.videoElement = document.createElement('video');
        this.videoElement.style.zIndex = '9999';
        this.videoElement.preload = 'auto';
        this.videoElement.poster = poster || '';
        this.container.appendChild(this.videoElement);
        this.detachEvents = this.attachEvents(this.videoElement);
    };
    CampaignAdPlayer.prototype.attachEvents = function (videoElement) {
        var handlers = {
            canplay: this.onCanPlay,
            canplaythrough: this.onCanPlayThrough,
            timeupdate: this.onTimeupdate,
            playing: this.onPlaying,
            pause: this.onPause,
            ended: this.onEnded,
            error: this.onError,
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
    CampaignAdPlayer.prototype.attachClickThrough = function (clickthrough, clicktracking) {
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
    CampaignAdPlayer.prototype.load = function (media, options) {
        var _this = this;
        if (!this.videoElement) {
            this.log('videoElement not defined during load');
            return;
        }
        this.log('load', media, options);
        var mediaUrl = media.video;
        // cleanup previous clickthrough listener and reset state for new media
        this.detachClickThrough();
        this.detachClickThrough = function () { };
        // reset core playback state for new load
        this.isStarted = false;
        this.isImpressionFired = false;
        this.canPlayEmitted = false;
        this.isTimeEventEmittedTwice = false;
        this.timeUpdateCount = 0;
        // Apply options if provided
        if (options) {
            var autoStart = options.autoStart, loop = options.loop, volume = options.volume, startAfterCanPlayThrough = options.startAfterCanPlayThrough, impDelaySec = options.impDelaySec;
            if (autoStart !== undefined)
                this.autoStart = autoStart;
            if (loop !== undefined)
                this.videoElement.loop = loop;
            if (volume !== undefined)
                this.setVolume(volume);
            if (startAfterCanPlayThrough !== undefined)
                this.startAfterCanPlayThrough = startAfterCanPlayThrough;
            if (impDelaySec !== undefined)
                this.impDelaySec = impDelaySec;
        }
        var trackAdErrorHandler = function (err) {
            _this.emit(constants_1.PLAYER_EVENTS.adBeaconFail, err, {
                id: media.id,
                type: 'impression',
            });
        };
        this.trackFn = (0, adTools_1.getAdTrackFn)(media, {
            errorHandler: trackAdErrorHandler,
            useQueueImpressions: true,
            sendImpAfterPosition: this.impDelaySec,
        });
        this.media = media;
        if (media.clickthrough && media.clicktracking) {
            this.detachClickThrough = this.attachClickThrough(media.clickthrough, media.clicktracking);
        }
        this.createAdEndChecker(this.videoElement);
        this.setVideoElementSrcForAd(this.videoElement, mediaUrl);
        this.videoElement.load();
    };
    CampaignAdPlayer.prototype.destroyAdEndChecker = function () {
        if (this.adEndChecker) {
            this.adEndChecker.destroy();
            this.adEndChecker = undefined;
        }
    };
    CampaignAdPlayer.prototype.setVolume = function (volume) {
        if (!this.videoElement) {
            return;
        }
        this.videoElement.volume = volume / 100;
    };
    /**
           * The buffered range from the video element itself
           */
    CampaignAdPlayer.prototype.getBufferedRange = function () {
        var _a;
        return (0, tools_1.transBufferedRangesIntoArray)((_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.buffered);
    };
    CampaignAdPlayer.prototype.getPosition = function () {
        var _a;
        return (_a = this.videoElement) === null || _a === void 0 ? void 0 : _a.currentTime;
    };
    CampaignAdPlayer.prototype.setVideoElementSrcForAd = function (videoElement, mediaUrl) {
        if ((0, dom_1.isSamsung2015)()) {
            mediaUrl = mediaUrl.replace(/^https/, 'http');
        }
        // clear existing sources to avoid accumulation across loads
        videoElement.removeAttribute('src');
        while (videoElement.firstChild) {
            videoElement.removeChild(videoElement.firstChild);
        }
        var source = document.createElement('source');
        source.src = mediaUrl;
        source.type = 'video/mp4';
        videoElement.appendChild(source);
    };
    return CampaignAdPlayer;
}(PlayerEventEmitter_1.PlayerEventEmitter));
exports.default = CampaignAdPlayer;
//# sourceMappingURL=campaignAdPlayer.js.map