"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var constants_1 = require("./constants");
var PlayerEventEmitter_1 = require("./utils/PlayerEventEmitter");
var tools_1 = require("./utils/tools");
var AndroidAdPlayer = /** @class */ (function (_super) {
    tslib_1.__extends(AndroidAdPlayer, _super);
    function AndroidAdPlayer(options) {
        var _this = _super.call(this) || this;
        _this.currentAdSequence = [];
        _this.isDestroyed = false;
        _this.isCanPlay = false;
        _this.isSetup = false;
        _this.isPreloaded = false;
        _this.isPlaying = false;
        _this.bridge = options.bridge;
        _this.options = options;
        _this.log = options.debug ? (0, tools_1.debug)('[AndroidAdPlayer]') : function () { };
        // Transform Ad objects to AdData for native player
        _this.updateCurrentAdSequence(options.ads);
        _this.setupBridgeHandlers();
        return _this;
    }
    AndroidAdPlayer.prototype.updateCurrentAdSequence = function (ads) {
        this.currentAdSequence = ads.map(function (ad) { return ({
            id: ad.id,
            videoUrl: ad.video,
            duration: Math.floor(ad.duration * 1000),
        }); });
        this.log('Updated current ad sequence:', this.currentAdSequence);
    };
    /**
     * Setup bridge event handlers to receive events from native player
     */
    AndroidAdPlayer.prototype.setupBridgeHandlers = function () {
        var _this = this;
        // Register handler for each native event to allow direct event dispatch
        var eventList = [
            "AdPlayer:OnPlayerEvent" /* NativePlayerEvents.START */,
            "AdPlayer:CanPlay" /* NativePlayerEvents.CAN_PLAY */,
            "AdPlayer:Buffering" /* NativePlayerEvents.BUFFERING */,
            "AdPlayer:Playing" /* NativePlayerEvents.PLAYING */,
            "AdPlayer:Pause" /* NativePlayerEvents.PAUSE */,
            "AdPlayer:TimeUpdate" /* NativePlayerEvents.TIME_UPDATE */,
            "AdPlayer:End" /* NativePlayerEvents.END */,
            "AdPlayer:Error" /* NativePlayerEvents.ERROR */,
        ];
        eventList.forEach(function (eventName) {
            _this.bridge.registerHandler(eventName, function (args) {
                // Some native bridges may only send data, not event name, so fallback to eventName
                _this.handlePlayerEvent(args.event || eventName, args.data);
            });
        });
    };
    /**
     * Handle player events from native
     */
    AndroidAdPlayer.prototype.handlePlayerEvent = function (event, data) {
        this.log('Received player event:', event, data);
        switch (event) {
            case "AdPlayer:CanPlay" /* NativePlayerEvents.CAN_PLAY */:
                this.onCanPlay(data);
                break;
            case "AdPlayer:Buffering" /* NativePlayerEvents.BUFFERING */:
                this.onBuffering(data);
                break;
            case "AdPlayer:Playing" /* NativePlayerEvents.PLAYING */:
                this.onPlaying(data);
                break;
            case "AdPlayer:Pause" /* NativePlayerEvents.PAUSE */:
                this.onPause(data);
                break;
            case "AdPlayer:TimeUpdate" /* NativePlayerEvents.TIME_UPDATE */:
                this.onTimeUpdate(data);
                break;
            case "AdPlayer:End" /* NativePlayerEvents.END */:
                this.onEnd(data);
                break;
            case "AdPlayer:Error" /* NativePlayerEvents.ERROR */:
                this.onError(data);
                break;
            default:
                this.log('Unknown player event:', event);
        }
    };
    /**
     * Wrap bridge calls in Promise for elegant async handling
     */
    AndroidAdPlayer.prototype.callBridgeHandler = function (handlerName, args) {
        var _this = this;
        if (args === void 0) { args = {}; }
        return new Promise(function (resolve, reject) {
            try {
                _this.bridge.callHandler(handlerName, args)
                    .then(function (response) {
                    var result = response;
                    if (result.success) {
                        resolve(result);
                    }
                    else {
                        reject(new Error(result.error || 'Bridge call failed'));
                    }
                })
                    .catch(reject);
            }
            catch (error) {
                reject(error);
            }
        });
    };
    /**
     * Preload ads for better playback experience
     */
    AndroidAdPlayer.prototype.preloadAds = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isDestroyed) {
                            throw new Error('Player has been destroyed');
                        }
                        if (this.isPreloaded) {
                            this.log('Ads already preloaded');
                            return [2 /*return*/];
                        }
                        this.log('Preloading ads:', this.currentAdSequence);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.callBridgeHandler("AdPlayer:Preload" /* NativePlayerHandlers.PRELOAD */, { ads: this.currentAdSequence })];
                    case 2:
                        _a.sent();
                        this.isPreloaded = true;
                        this.log('Ads preloaded successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.log('Failed to preload ads:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Setup native player and prepare for playback
     */
    AndroidAdPlayer.prototype.setupPlayer = function () {
        return tslib_1.__awaiter(this, arguments, void 0, function (options) {
            var error_2;
            if (options === void 0) { options = {}; }
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isDestroyed) {
                            throw new Error('Player has been destroyed');
                        }
                        if (this.isSetup) {
                            this.log('Player already setup');
                            return [2 /*return*/];
                        }
                        this.log('Setting up player:', this.currentAdSequence, options);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.callBridgeHandler("AdPlayer:Setup" /* NativePlayerHandlers.SETUP */, { ads: this.currentAdSequence, options: options })];
                    case 2:
                        _a.sent();
                        this.isSetup = true;
                        this.log('Player setup completed');
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.log('Failed to setup player:', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start or resume playback
     */
    AndroidAdPlayer.prototype.play = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isDestroyed) {
                            throw new Error('Player has been destroyed');
                        }
                        // Check if player is ready to play
                        if (!this.isCanPlay) {
                            throw new Error('Player is not ready to play. Wait for canPlay event.');
                        }
                        if (!this.isSetup) {
                            throw new Error('Player is not setup. Call setupPlayer() first.');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.callBridgeHandler("AdPlayer:Play" /* NativePlayerHandlers.PLAY */)];
                    case 2:
                        _a.sent();
                        this.log('Play command sent successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.log('Failed to play:', error_3);
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Pause playback
     */
    AndroidAdPlayer.prototype.pause = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isDestroyed) {
                            throw new Error('Player has been destroyed');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.callBridgeHandler("AdPlayer:Pause" /* NativePlayerHandlers.PAUSE */)];
                    case 2:
                        _a.sent();
                        this.log('Pause command sent successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        this.log('Failed to pause:', error_4);
                        throw error_4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Set playback volume (0-100)
     */
    AndroidAdPlayer.prototype.setVolume = function (volume) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error_5;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isDestroyed) {
                            throw new Error('Player has been destroyed');
                        }
                        if (volume < 0 || volume > 100) {
                            throw new Error('Volume must be between 0 and 100');
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.callBridgeHandler("AdPlayer:SetVolume" /* NativePlayerHandlers.SET_VOLUME */, { volume: volume })];
                    case 2:
                        _a.sent();
                        this.log('Volume set to:', volume);
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        this.log('Failed to set volume:', error_5);
                        throw error_5;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Destroy player and clean up resources
     */
    AndroidAdPlayer.prototype.remove = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error_6;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isDestroyed) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.callBridgeHandler("AdPlayer:Destroy" /* NativePlayerHandlers.DESTROY */)];
                    case 2:
                        _a.sent();
                        this.isDestroyed = true;
                        this.isCanPlay = false;
                        this.isSetup = false;
                        this.isPreloaded = false;
                        this.log('Player destroyed successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        this.log('Failed to destroy player:', error_6);
                        // Mark as destroyed even if native destroy fails
                        this.isDestroyed = true;
                        this.isCanPlay = false;
                        this.isSetup = false;
                        this.isPreloaded = false;
                        throw error_6;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle canplay event - ad has sufficient buffer
     */
    AndroidAdPlayer.prototype.onCanPlay = function (data) {
        this.log('Ad can play:', data);
        this.isCanPlay = true;
        this.emit(constants_1.PLAYER_EVENTS.canPlay, {
            isResumePositionBuffered: false,
        });
    };
    /**
     * Handle buffering event
     */
    AndroidAdPlayer.prototype.onBuffering = function (data) {
        this.log('Ad buffering:', data);
        this.emit(constants_1.PLAYER_EVENTS.bufferStart, {
            reason: 'network',
        });
    };
    /**
     * Handle playing event
     */
    AndroidAdPlayer.prototype.onPlaying = function (data) {
        this.log('Ad playing:', data);
        this.emit(constants_1.PLAYER_EVENTS.play, data);
        this.isPlaying = true;
    };
    /**
     * Handle pause event
     */
    AndroidAdPlayer.prototype.onPause = function (data) {
        this.log('Ad paused:', data);
        this.emit(constants_1.PLAYER_EVENTS.pause, data);
        this.isPlaying = false;
    };
    /**
     * Handle time update event for progress tracking
     */
    AndroidAdPlayer.prototype.onTimeUpdate = function (data) {
        this.log('Time update:', data);
        this.emit(constants_1.PLAYER_EVENTS.time, {
            adId: data.adId,
            position: data.position || 0,
            duration: data.duration || 0,
        });
    };
    /**
     * Handle ad completion event
     */
    AndroidAdPlayer.prototype.onEnd = function (data) {
        this.log('Ad ended:', data);
        this.emit(constants_1.PLAYER_EVENTS.complete, data);
    };
    /**
     * Handle playback error event
     */
    AndroidAdPlayer.prototype.onError = function (data) {
        this.log('Ad error:', data);
        this.emit(constants_1.PLAYER_EVENTS.error, {
            type: constants_1.ErrorType.MEDIA_ERROR,
            errorSource: constants_1.ERROR_SOURCE.NATIVE_ERROR,
            error: new Error(data.message || 'Unknown playback error'),
            message: data.message,
            code: data.code,
            fatal: true,
        });
    };
    /**
     * Check if player is destroyed
     */
    AndroidAdPlayer.prototype.isPlayerDestroyed = function () {
        return this.isDestroyed;
    };
    /**
     * Check if player can play
     */
    AndroidAdPlayer.prototype.canPlay = function () {
        return this.isCanPlay;
    };
    /**
     * Check if player is setup
     */
    AndroidAdPlayer.prototype.isPlayerSetup = function () {
        return this.isSetup;
    };
    /**
     * Check if ads are preloaded
     */
    AndroidAdPlayer.prototype.areAdsPreloaded = function () {
        return this.isPreloaded;
    };
    /**
     * Get current ad sequence
     */
    AndroidAdPlayer.prototype.getCurrentAdSequence = function () {
        return tslib_1.__spreadArray([], this.currentAdSequence, true);
    };
    /**
     * Get bridge instance (for advanced usage)
     */
    AndroidAdPlayer.prototype.getBridge = function () {
        return this.bridge;
    };
    return AndroidAdPlayer;
}(PlayerEventEmitter_1.PlayerEventEmitter));
exports.default = AndroidAdPlayer;
//# sourceMappingURL=androidAdPlayer.js.map