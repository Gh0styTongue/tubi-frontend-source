"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initialState = void 0;
var tslib_1 = require("tslib");
var constants_1 = require("./constants");
var types_1 = require("./types");
// todo(liam/chun) continue refactoring the player state
exports.initialState = {
    playerState: constants_1.State.idle,
    contentType: constants_1.PLAYER_CONTENT_TYPE.video,
    progress: {
        position: 0,
        duration: 0,
        bufferPosition: 0,
        isBuffering: false,
    },
    adProgress: {
        position: 0,
        duration: 0,
    },
    ad: {
        adCount: 1,
        adSequence: 1,
    },
    quality: {
        restrictedLevels: [],
        qualityList: [],
        qualityIndex: 0,
        isHD: false,
    },
    captions: {
        captionsList: [],
        captionsIndex: 0,
    },
    volume: {
        volume: 0,
        isMuted: false,
    },
    bitrate: -1,
    timeGapToLastBuffer: -1,
    drmKeySystem: null,
    canAutoplay: false,
    videoPreviewMuted: false,
};
exports.default = (function (state, action) {
    if (state === void 0) { state = exports.initialState; }
    switch (action.type) {
        case types_1.ActionTypes.TRANSIT_PLAYER_STATE:
            return tslib_1.__assign(tslib_1.__assign({}, state), action.payload);
        case types_1.ActionTypes.UPDATE_PLAYER_PROGRESS:
            return tslib_1.__assign(tslib_1.__assign({}, state), { progress: tslib_1.__assign(tslib_1.__assign({}, state.progress), action.payload) });
        case types_1.ActionTypes.UPDATE_AD_PROGRESS:
            return tslib_1.__assign(tslib_1.__assign({}, state), { adProgress: tslib_1.__assign(tslib_1.__assign({}, state.adProgress), action.payload) });
        case types_1.ActionTypes.UPDATE_PLAYER_AD_INFO:
            return tslib_1.__assign(tslib_1.__assign({}, state), { ad: tslib_1.__assign(tslib_1.__assign({}, state.ad), action.payload) });
        case types_1.ActionTypes.UPDATE_PLAYER_VOLUME:
            return tslib_1.__assign(tslib_1.__assign({}, state), { volume: tslib_1.__assign(tslib_1.__assign({}, state.volume), action.payload) });
        case types_1.ActionTypes.UPDATE_PLAYER_QUALITY:
            return tslib_1.__assign(tslib_1.__assign({}, state), { quality: tslib_1.__assign(tslib_1.__assign({}, state.quality), action.payload) });
        case types_1.ActionTypes.UPDATE_PLAYER_CAPTIONS:
            return tslib_1.__assign(tslib_1.__assign({}, state), { captions: tslib_1.__assign(tslib_1.__assign({}, state.captions), action.payload) });
        case types_1.ActionTypes.RESET_PLAYER:
            return tslib_1.__assign(tslib_1.__assign({}, exports.initialState), { 
                // keep drmKeySystem/canAutoplay still as no need to check multiple times.
                drmKeySystem: state.drmKeySystem, canAutoplay: state.canAutoplay });
        case types_1.ActionTypes.SET_AUTOPLAY_CAPABILITY:
            return tslib_1.__assign(tslib_1.__assign({}, state), { canAutoplay: action.payload });
        case types_1.ActionTypes.UPDATE_DRM_KEY_SYSTEM:
            return tslib_1.__assign(tslib_1.__assign({}, state), { drmKeySystem: action.payload });
        case types_1.ActionTypes.UPDATE_PLAYER_BITRATE:
            return tslib_1.__assign(tslib_1.__assign({}, state), { bitrate: action.payload });
        case types_1.ActionTypes.UPDATE_TIME_GAP_TO_LAST_BUFFER:
            return tslib_1.__assign(tslib_1.__assign({}, state), { timeGapToLastBuffer: action.payload });
        case types_1.ActionTypes.UPDATE_VIDEO_PREVIEW_MUTED:
            return tslib_1.__assign(tslib_1.__assign({}, state), { videoPreviewMuted: action.payload });
        default:
            return state;
    }
});
//# sourceMappingURL=reducer.js.map