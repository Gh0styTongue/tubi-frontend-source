"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVideoPreviewMuted = exports.infoActions = exports.drmActions = exports.controlActions = exports.reset = exports.init = exports.setAutoplayCapability = exports.updateVolume = exports.transit = exports.removePlayerInstance = void 0;
var tslib_1 = require("tslib");
var promiseManager_1 = tslib_1.__importDefault(require("@adrise/utils/lib/promiseManager"));
var time_1 = require("@adrise/utils/lib/time");
var tools_1 = require("@adrise/utils/lib/tools");
var shallowequal_1 = tslib_1.__importDefault(require("shallowequal"));
var constants_1 = require("./constants");
var interceptor_1 = require("./interceptor/interceptor");
var types_1 = require("./types");
var drm_1 = require("./utils/drm");
var isBufferingTimer;
var playbackInfoIntervalTimer;
// NOTE `redux-devtools` chrome extension can't serialize player instance correctly
// so we put it here as a workaround
var playerInstance;
var getPlayerInstance = function () { return playerInstance; };
// for testing only
var removePlayerInstance = function () { return playerInstance = undefined; };
exports.removePlayerInstance = removePlayerInstance;
var promiseManager = new promiseManager_1.default();
var drmPromiseManager = new promiseManager_1.default();
/**
 * update player progress, in particularly, update position and duration
 */
var updateProgress = function (progress) {
    return function (dispatch, getState) {
        var previousProgress = (0, tools_1.pick)(getState().player.progress, Object.keys(progress));
        if ((0, shallowequal_1.default)(previousProgress, progress))
            return;
        dispatch({
            type: types_1.ActionTypes.UPDATE_PLAYER_PROGRESS,
            payload: progress,
        });
    };
};
var updateAdProgress = function (adProgress) {
    return function (dispatch, getState) {
        var previousProgress = (0, tools_1.pick)(getState().player.adProgress, Object.keys(adProgress));
        if ((0, shallowequal_1.default)(previousProgress, adProgress))
            return;
        dispatch({
            type: types_1.ActionTypes.UPDATE_AD_PROGRESS,
            payload: adProgress,
        });
    };
};
var resetAdProgress = function () {
    return function (dispatch) {
        dispatch({
            type: types_1.ActionTypes.UPDATE_AD_PROGRESS,
            payload: {
                duration: 0,
                position: 0,
                remainingPodDuration: undefined,
            },
        });
    };
};
var transit = function (playerState, extraData) {
    if (extraData === void 0) { extraData = {}; }
    return function (dispatch, getState) {
        var contentType = getState().player.contentType;
        var payload = tslib_1.__assign(tslib_1.__assign({}, extraData), { playerState: playerState });
        // when seeking or content type changes, reset `bufferPosition`
        if (playerState === constants_1.State.seeking
            || (extraData.contentType && extraData.contentType !== contentType)) {
            dispatch(updateProgress({ bufferPosition: 0 }));
        }
        dispatch({
            type: types_1.ActionTypes.TRANSIT_PLAYER_STATE,
            payload: payload,
        });
    };
};
exports.transit = transit;
var updateVolume = function (_a) {
    var volume = _a.volume, isMuted = _a.isMuted;
    return function (dispatch, getState) {
        var _a = getState().player.volume, previousVolume = _a.volume, previousIsMuted = _a.isMuted;
        if (typeof volume !== 'undefined' && volume !== previousVolume) {
            dispatch({
                type: types_1.ActionTypes.UPDATE_PLAYER_VOLUME,
                payload: {
                    volume: volume,
                    // when initialization, both `volume` and `isMuted` are specified, otherwise set `isMuted` to `false`
                    isMuted: typeof isMuted !== 'undefined' ? isMuted : false,
                },
            });
        }
        else if (typeof isMuted !== 'undefined' && isMuted !== previousIsMuted) {
            dispatch({
                type: types_1.ActionTypes.UPDATE_PLAYER_VOLUME,
                payload: { isMuted: isMuted },
            });
        }
    };
};
exports.updateVolume = updateVolume;
var updateQuality = function (quality) { return function (dispatch, getState) {
    var _a = quality, visualQualityIndex = _a.visualQualityIndex, payload = tslib_1.__rest(_a, ["visualQualityIndex"]);
    if (visualQualityIndex) {
        var _b = getState().player.quality, qualityList = _b.qualityList, isHD = _b.isHD;
        var isHDNow = qualityList[visualQualityIndex].height >= 720;
        if (isHDNow !== isHD) {
            payload.isHD = isHDNow;
        }
    }
    if (Object.keys(payload).length === 0) {
        return;
    }
    dispatch({
        type: types_1.ActionTypes.UPDATE_PLAYER_QUALITY,
        payload: payload,
    });
}; };
var lastBufferChangeTime = -1;
/**
 * update ad info
 */
var updateAdInfo = function (adInfo) {
    return function (dispatch, getState) {
        if ((0, shallowequal_1.default)(getState().player.ad, adInfo))
            return;
        dispatch({
            type: types_1.ActionTypes.UPDATE_PLAYER_AD_INFO,
            payload: adInfo,
        });
    };
};
var subscribePlayerEvents = function (dispatch, getState, player, videoDuration) {
    // playback
    player.on(constants_1.PLAYER_EVENTS.play, function () {
        dispatch((0, exports.transit)(constants_1.State.playing, {
            contentType: constants_1.PLAYER_CONTENT_TYPE.video,
        }));
    });
    player.on(constants_1.PLAYER_EVENTS.pause, function () {
        dispatch((0, exports.transit)(constants_1.State.paused));
    });
    player.on(constants_1.PLAYER_EVENTS.time, function (_a) {
        var position = _a.position, duration = _a.duration;
        var storePosition = getState().player.progress.position;
        var nextPosition = Math.floor(position);
        // when seeked visual quality starts to change, `player.getDuration()` may return `NaN`,
        // and the `position` is 0, so we check this feature to avoid unnecessary shrinking
        if (storePosition > 0 && nextPosition === 0 && isNaN(duration))
            return;
        // `time` may occur as frequently as 10 times per second
        if (nextPosition !== storePosition) {
            dispatch(updateProgress({
                position: nextPosition,
                duration: Math.floor(duration) || videoDuration,
            }));
        }
    });
    player.on(constants_1.PLAYER_EVENTS.complete, function () {
        dispatch((0, exports.transit)(constants_1.State.completed));
    });
    // volume
    player.on(constants_1.PLAYER_EVENTS.mute, function (event) {
        dispatch((0, exports.updateVolume)({ isMuted: event.mute }));
    });
    player.on(constants_1.PLAYER_EVENTS.volume, function (event) {
        dispatch((0, exports.updateVolume)(event));
    });
    // ad
    player.on(constants_1.PLAYER_EVENTS.adStartLoad, function () {
        // respect the existing state when transitioning to ad content type
        dispatch(function (dispatch, getState) {
            var playerState = getState().player.playerState;
            dispatch((0, exports.transit)(playerState, {
                contentType: constants_1.PLAYER_CONTENT_TYPE.ad,
            }));
            // ensure that anything that depends on adProgress sees empty data
            dispatch(resetAdProgress());
        });
    });
    player.on(constants_1.PLAYER_EVENTS.adPlay, function () {
        dispatch((0, exports.transit)(constants_1.State.playing, {
            contentType: constants_1.PLAYER_CONTENT_TYPE.ad,
        }));
    });
    player.on(constants_1.PLAYER_EVENTS.adPause, function () {
        dispatch((0, exports.transit)(constants_1.State.paused));
    });
    player.on(constants_1.PLAYER_EVENTS.adStart, function (event) {
        var adSequence = event.adSequence;
        // only reset adProgress when first ad starts playing
        if (adSequence === 1) {
            dispatch(updateAdProgress({
                duration: 0,
                position: 0,
            }));
        }
    });
    // NOTE sometimes `adTime` may occur one time after `adPause`,
    // so we'd better not to update playerState here
    player.on(constants_1.PLAYER_EVENTS.adTime, function (event) {
        // NOTE if there is only one ad, `podcount` and `sequence` will be `undefined`
        dispatch(updateAdInfo({
            adCount: event.podcount || 1,
            adSequence: event.sequence || 1,
        }));
        dispatch(updateAdProgress({
            // update `position` more aggressively, several times per second
            // sometimes ad position is negative, so use `Math.max` to keep it >= 0
            position: Math.max(0, Math.floor(event.position * 10) / 10),
            duration: Math.max(0, Math.floor(event.duration)),
            remainingPodDuration: event.remainingPodDuration,
        }));
    });
    // make sure the contentType switches to video when adPodCompletes
    player.on(constants_1.PLAYER_EVENTS.adPodComplete, function () {
        dispatch((0, exports.transit)(constants_1.State.playing, {
            contentType: constants_1.PLAYER_CONTENT_TYPE.video,
        }));
    });
    // buffering
    player.on(constants_1.PLAYER_EVENTS.bufferChange, function (event) {
        var bufferPosition = Math.floor(event.duration * event.bufferPercent / 100);
        dispatch(updateProgress({ bufferPosition: bufferPosition }));
        lastBufferChangeTime = (0, time_1.now)();
    });
    player.on(constants_1.PLAYER_EVENTS.bufferStart, function () {
        clearTimeout(isBufferingTimer);
        // buffering may happen very frequent, don't show spinner immediately
        isBufferingTimer = window.setTimeout(function () {
            dispatch(updateProgress({ isBuffering: true }));
        }, 500);
    });
    player.on(constants_1.PLAYER_EVENTS.bufferEnd, function () {
        clearTimeout(isBufferingTimer);
        dispatch(updateProgress({ isBuffering: false }));
    });
    // captions
    player.on(constants_1.PLAYER_EVENTS.captionsListChange, function (_a) {
        var captionsList = _a.captionsList;
        dispatch({
            type: types_1.ActionTypes.UPDATE_PLAYER_CAPTIONS,
            payload: { captionsList: captionsList },
        });
    });
    player.on(constants_1.PLAYER_EVENTS.captionsChange, function (_a) {
        var captionsIndex = _a.captionsIndex;
        dispatch({
            type: types_1.ActionTypes.UPDATE_PLAYER_CAPTIONS,
            payload: { captionsIndex: captionsIndex },
        });
    });
    player.on(constants_1.PLAYER_EVENTS.captionsStylesChange, function (_a) {
        var captionsStyles = _a.captionsStyles;
        dispatch({
            type: types_1.ActionTypes.UPDATE_PLAYER_CAPTIONS,
            payload: { captionsStyles: captionsStyles },
        });
    });
    // quality
    player.on(constants_1.PLAYER_EVENTS.qualityListChange, function (_a) {
        var qualityList = _a.qualityList;
        dispatch(updateQuality({ qualityList: qualityList }));
    });
    player.on(constants_1.PLAYER_EVENTS.qualityChange, function (_a) {
        var qualityIndex = _a.qualityIndex;
        dispatch(updateQuality({ qualityIndex: qualityIndex }));
    });
    player.on(constants_1.PLAYER_EVENTS.visualQualityChange, function (_a) {
        var qualityIndex = _a.qualityIndex;
        dispatch(updateQuality({ visualQualityIndex: qualityIndex }));
    });
    player.on(constants_1.PLAYER_EVENTS.restrictedQualityListChange, function (_a) {
        var restrictedLevels = _a.restrictedLevels;
        dispatch(updateQuality({ restrictedLevels: restrictedLevels }));
    });
};
var setupPlaybackInfoIntervalTimer = function (dispatch, player) {
    window.clearInterval(playbackInfoIntervalTimer);
    playbackInfoIntervalTimer = window.setInterval(function () {
        var bitrate = player.getBitrate();
        dispatch(updateBitrate(bitrate));
        /* istanbul ignore else */
        if (lastBufferChangeTime > 0) {
            var gap = (0, time_1.now)() - lastBufferChangeTime;
            dispatch(updateTimeGapToLastBuffer(gap));
        }
    }, constants_1.PLAYER_BUFFER_CHANGE_EMIT_INTERVAL);
};
var updateBitrate = function (bitrate) { return function (dispatch, getState) {
    if (bitrate <= 0)
        return;
    var oldBitrate = getState().player.bitrate;
    if (bitrate === oldBitrate)
        return;
    return dispatch({
        type: types_1.ActionTypes.UPDATE_PLAYER_BITRATE,
        payload: bitrate,
    });
}; };
var setAutoplayCapability = function (canAutoplay) { return ({
    type: types_1.ActionTypes.SET_AUTOPLAY_CAPABILITY,
    payload: canAutoplay,
}); };
exports.setAutoplayCapability = setAutoplayCapability;
var updateTimeGapToLastBuffer = function (gap) { return function (dispatch, _getState) {
    dispatch({
        type: types_1.ActionTypes.UPDATE_TIME_GAP_TO_LAST_BUFFER,
        payload: gap,
    });
}; };
var actionTimeout = function (action) {
    var _a, _b;
    // We will call the `updateDrmKeySystem` action earlier on the Web platform.
    // There was no player instance at that time.
    return ((_b = (_a = getPlayerInstance()) === null || _a === void 0 ? void 0 : _a.actionsTimeout) === null || _b === void 0 ? void 0 : _b[action]) || -1;
};
function getActionTimeout(actionType, defaultSeconds) {
    if (defaultSeconds === void 0) { defaultSeconds = 5; }
    var timeout = actionTimeout(actionType);
    return (0, time_1.secs)(timeout > 0 ? timeout : defaultSeconds);
}
/**
 * init player store
 */
var init = function (player, position, duration) {
    if (position === void 0) { position = 0; }
    if (duration === void 0) { duration = 0; }
    return function (dispatch, getState) {
        subscribePlayerEvents(dispatch, getState, player, duration);
        if (player.shouldReportBitrate) {
            setupPlaybackInfoIntervalTimer(dispatch, player);
        }
        playerInstance = player;
        dispatch((0, exports.transit)(constants_1.State.inited));
        dispatch(updateProgress({ position: position, duration: duration }));
        dispatch((0, exports.updateVolume)({ isMuted: player.getMute(), volume: player.getVolume() }));
    };
};
exports.init = init;
/**
 * reset player
 */
var reset = function () {
    clearTimeout(isBufferingTimer);
    clearInterval(playbackInfoIntervalTimer);
    promiseManager.abortAll();
    playerInstance = undefined;
    lastBufferChangeTime = -1;
    return {
        type: types_1.ActionTypes.RESET_PLAYER,
    };
};
exports.reset = reset;
/**
 * control actions, these actions will call player instance methods, such as `play`, `pause`, etc.
 * TODO move them to player redux middleware
 */
exports.controlActions = {
    /**
     * play content/ad
     */
    play: function (level) { return function (dispatch, getState) { return promiseManager.createPromise(function (resolve) {
        var _a = getState().player, playerState = _a.playerState, contentType = _a.contentType, position = _a.progress.position;
        if (playerState === constants_1.State.playing) {
            resolve();
            return;
        }
        var event = contentType === constants_1.PLAYER_CONTENT_TYPE.ad ? constants_1.PLAYER_EVENTS.adPlay : constants_1.PLAYER_EVENTS.play;
        var action = function () {
            var instance = getPlayerInstance();
            if (typeof instance === 'undefined') {
                resolve();
                return;
            }
            // NOTE `play` event won't fire synchronously after calling `play` method
            instance.once(event, resolve);
            var executed = instance.play(level);
            // NOTE some vpaid ads don't emit `adPlay` event after the previous line, this is a workaround for it
            if (executed && contentType === constants_1.PLAYER_CONTENT_TYPE.ad) {
                dispatch((0, exports.transit)(constants_1.State.playing, {
                    contentType: constants_1.PLAYER_CONTENT_TYPE.ad,
                }));
            }
        };
        if (playerState === constants_1.State.seeking) {
            dispatch(exports.controlActions.seek(position, action));
        }
        else {
            action();
        }
        return {
            onReject: function () { var _a; /* istanbul ignore next */ return (_a = getPlayerInstance()) === null || _a === void 0 ? void 0 : _a.removeListener(event, resolve); },
        };
    }, {
        timeout: getActionTimeout(types_1.ActionTypeInTimeoutPromise.PLAY),
        handlerName: 'play',
    }); }; },
    /**
     * pause content/ad
     */
    pause: function () { return function (dispatch, getState) { return promiseManager.createPromise(function (resolve) {
        var instance = getPlayerInstance();
        var _a = getState().player, playerState = _a.playerState, contentType = _a.contentType, position = _a.progress.position;
        /* istanbul ignore if */
        if (typeof instance === 'undefined'
            // pausing when already paused is a no-op
            || playerState === constants_1.State.paused) {
            resolve();
            return;
        }
        var event = contentType === constants_1.PLAYER_CONTENT_TYPE.ad ? constants_1.PLAYER_EVENTS.adPause : constants_1.PLAYER_EVENTS.pause;
        var action = function () {
            // NOTE `pause` event won't fire synchronously after calling `pause` method
            instance.once(event, resolve);
            instance.pause();
            // NOTE some vpaid ads don't emit `adPause` event after the previous line, this is a workaround for it
            if (contentType === constants_1.PLAYER_CONTENT_TYPE.ad) {
                dispatch((0, exports.transit)(constants_1.State.paused));
            }
        };
        if (playerState === constants_1.State.seeking) {
            dispatch(exports.controlActions.seek(position, action));
        }
        else {
            action();
        }
        return {
            onReject: function () { return instance.removeListener(event, resolve); },
        };
    }, {
        timeout: getActionTimeout(types_1.ActionTypeInTimeoutPromise.PAUSE),
        handlerName: 'pause',
    }); }; },
    /**
     * seek to a position
     * returns a Promise that resolves with the new position
     */
    seek: function (position, callback) { return function (dispatch, getState) { return promiseManager.createPromise(function (resolve) {
        var _a = getState().player, duration = _a.progress.duration, playerState = _a.playerState;
        var instance = getPlayerInstance();
        if (typeof instance === 'undefined') {
            resolve(-1);
            return;
        }
        var targetPosition = (0, tools_1.clamp)(position, 0, duration || Number.POSITIVE_INFINITY);
        // declare a function here to remove the listener in 'destroy' below
        var onSeeked = function () {
            dispatch(updateProgress({ position: targetPosition }));
            if (callback) {
                callback();
            }
            else {
                dispatch(exports.controlActions.play(interceptor_1.ActionLevel.UI));
            }
            resolve(targetPosition);
        };
        if (instance.shouldWaitForSeekedEvent) {
            instance.once(constants_1.PLAYER_EVENTS.seeked, onSeeked);
        }
        // Reset player state to inited if it is in completed state
        if (playerState === constants_1.State.completed) {
            dispatch((0, exports.transit)(constants_1.State.inited));
        }
        instance.seek(targetPosition);
        if (!instance.shouldWaitForSeekedEvent) {
            onSeeked();
        }
        return {
            onReject: function () {
                instance.removeListener(constants_1.PLAYER_EVENTS.seeked, onSeeked);
            },
        };
    }, {
        timeout: getActionTimeout(types_1.ActionTypeInTimeoutPromise.SEEK, 10),
        timeoutCallback: function () {
            var instance = getPlayerInstance();
            instance === null || instance === void 0 ? void 0 : instance.emit(constants_1.PLAYER_EVENTS.seekActionTimeout);
        },
        handlerName: 'seek',
    }); }; },
    /**
     * one step rewind
     */
    stepRewind: function () { return function (dispatch, getState) {
        var position = getState().player.progress.position;
        return dispatch(exports.controlActions.seek(position - constants_1.PLAYER_STEP_SEEK_INTERVAL));
    }; },
    /**
     * one step forward
     * when stepForward is done, resolve the promise with the new position
     */
    stepForward: function () { return function (dispatch, getState) {
        var position = getState().player.progress.position;
        return dispatch(exports.controlActions.seek(position + constants_1.PLAYER_STEP_SEEK_INTERVAL));
    }; },
    /**
     * set volume/mute
     */
    setVolume: function (_a) {
        var volume = _a.volume, isMuted = _a.isMuted;
        return function () {
            var instance = getPlayerInstance();
            /* istanbul ignore if */
            if (typeof instance === 'undefined')
                return;
            if (typeof volume !== 'undefined') {
                instance.setVolume(volume);
            }
            else {
                instance.setMute(!!isMuted);
            }
        };
    },
    /**
     * set captions index
     */
    setCaptions: function (index) { return function () { return new Promise(function (resolve) {
        var instance = getPlayerInstance();
        /* istanbul ignore else */
        if (typeof instance !== 'undefined') {
            instance.once(constants_1.PLAYER_EVENTS.captionsChange, function (e) { return resolve(e.captionsIndex); });
            instance.setCaptions(index);
        }
        resolve();
    }); }; },
    /**
     * set quality index
     */
    setQuality: function (index) { return function () { return new Promise(function (resolve) {
        var instance = getPlayerInstance();
        /* istanbul ignore else */
        if (typeof instance !== 'undefined') {
            instance.setQuality(index);
        }
        resolve();
    }); }; },
};
exports.drmActions = {
    updateDrmKeySystem: function () {
        // only dispatch "ActionTypes.UPDATE_DRM_KEY_SYSTEM" when it has no valid value
        // as drm key system detection only needs to be done once after app starts
        return function (dispatch, getState) { return tslib_1.__awaiter(void 0, void 0, void 0, function () {
            var drmKeySystem, nextDrmKeySystem, _a;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        drmKeySystem = getState().player.drmKeySystem;
                        if (!(drmKeySystem === null)) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, drmPromiseManager.createPromise(function (resolve, reject) {
                                (0, drm_1.getDrmKeySystem)()
                                    .then(function (value) { return resolve(value); })
                                    .catch(function (error) { return reject && reject(error); });
                            }, {
                                timeout: getActionTimeout(types_1.ActionTypeInTimeoutPromise.UPDATE_DRM_KEY),
                            })];
                    case 2:
                        nextDrmKeySystem = _b.sent();
                        dispatch({ type: types_1.ActionTypes.UPDATE_DRM_KEY_SYSTEM, payload: nextDrmKeySystem });
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        dispatch({ type: types_1.ActionTypes.UPDATE_DRM_KEY_SYSTEM, payload: constants_1.DrmKeySystem.Invalid });
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    },
};
exports.infoActions = {
    updateBitrate: updateBitrate,
    updateProgress: updateProgress,
    updateTimeGapToLastBuffer: updateTimeGapToLastBuffer,
};
var updateVideoPreviewMuted = function (payload) { return ({
    type: types_1.ActionTypes.UPDATE_VIDEO_PREVIEW_MUTED,
    payload: payload,
}); };
exports.updateVideoPreviewMuted = updateVideoPreviewMuted;
//# sourceMappingURL=action.js.map