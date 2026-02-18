"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoResolutionType = exports.VideoResourceTypeState = exports.PlayerDisplayMode = exports.SeekType = exports.PauseState = exports.ToggleState = exports.ActionStatus = exports.isLanguage = void 0;
var isLanguage = function (lang) {
    return ['UNKNOWN', 'EN', 'ES', 'FR', 'DE', 'PT', 'IT', 'KO', 'JA', 'ZH'].includes(lang);
};
exports.isLanguage = isLanguage;
var ActionStatus;
(function (ActionStatus) {
    ActionStatus["UNKNOWN_ACTION_STATUS"] = "UNKNOWN_ACTION_STATUS";
    ActionStatus["SUCCESS"] = "SUCCESS";
    ActionStatus["FAIL"] = "FAIL";
})(ActionStatus = exports.ActionStatus || (exports.ActionStatus = {}));
var ToggleState;
(function (ToggleState) {
    ToggleState["UNKNOWN_TOGGLE_STATE"] = "UNKNOWN_TOGGLE_STATE";
    ToggleState["ON"] = "ON";
    ToggleState["OFF"] = "OFF";
})(ToggleState = exports.ToggleState || (exports.ToggleState = {}));
var PauseState;
(function (PauseState) {
    PauseState["UNKNOWN"] = "UNKNOWN";
    PauseState["PAUSED"] = "PAUSED";
    PauseState["RESUMED"] = "RESUMED";
})(PauseState = exports.PauseState || (exports.PauseState = {}));
var SeekType;
(function (SeekType) {
    SeekType["UNKNOWN"] = "UNKNOWN";
    SeekType["QUICK_SEEK_BUTTON"] = "QUICK_SEEK_BUTTON";
    // TODO: Deprecated, should switch to QUICK_SEEK_BUTTON with rate
    SeekType["QUICK_SEEK_BUTTON_15S"] = "QUICK_SEEK_BUTTON_15S";
    // TODO: Deprecated, should switch to QUICK_SEEK_BUTTON with rate
    SeekType["QUICK_SEEK_BUTTON_30S"] = "QUICK_SEEK_BUTTON_30S";
    SeekType["PLAY_PROGRESS_DRAG"] = "PLAY_PROGRESS_DRAG";
    SeekType["REMOTE_LEFT_RIGHT_BUTTON"] = "REMOTE_LEFT_RIGHT_BUTTON";
    SeekType["PLAYER_CONTROL_LEFT_RIGHT_BUTTON"] = "PLAYER_CONTROL_LEFT_RIGHT_BUTTON";
    // TODO: Deprecated: Use REMOTE_LEFT_RIGHT_BUTTON and rate field instead.
    SeekType["PLAYER_CONTROL_LEFT_RIGHT_BUTTON_2x"] = "PLAYER_CONTROL_LEFT_RIGHT_BUTTON_2x";
    // TODO: Deprecated: Use REMOTE_LEFT_RIGHT_BUTTON and rate field instead.
    SeekType["PLAYER_CONTROL_LEFT_RIGHT_BUTTON_3x"] = "PLAYER_CONTROL_LEFT_RIGHT_BUTTON_3x";
    SeekType["VOICE_COMMAND"] = "VOICE_COMMAND";
    SeekType["JUMP_BACK_BUTTON"] = "JUMP_BACK_BUTTON";
    SeekType["SKIP_INTRO"] = "SKIP_INTRO";
    SeekType["SKIP_RECAP"] = "SKIP_RECAP";
    SeekType["SKIP_EARLY_CREDITS"] = "SKIP_EARLY_CREDITS";
})(SeekType = exports.SeekType || (exports.SeekType = {}));
var PlayerDisplayMode;
(function (PlayerDisplayMode) {
    PlayerDisplayMode["DEFAULT"] = "DEFAULT";
    PlayerDisplayMode["VIDEO_IN_GRID"] = "VIDEO_IN_GRID";
    PlayerDisplayMode["PICTURE_IN_PICTURE"] = "PICTURE_IN_PICTURE";
    PlayerDisplayMode["IN_APP_PICTURE_IN_PICTURE"] = "IN_APP_PICTURE_IN_PICTURE";
    PlayerDisplayMode["BANNER"] = "BANNER";
})(PlayerDisplayMode = exports.PlayerDisplayMode || (exports.PlayerDisplayMode = {}));
var VideoResourceTypeState;
(function (VideoResourceTypeState) {
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_UNKNOWN"] = "VIDEO_RESOURCE_TYPE_UNKNOWN";
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_HLSV3"] = "VIDEO_RESOURCE_TYPE_HLSV3";
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_HLSV6"] = "VIDEO_RESOURCE_TYPE_HLSV6";
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_DASH_WIDEVINE"] = "VIDEO_RESOURCE_TYPE_DASH_WIDEVINE";
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_DASH_PLAYREADY"] = "VIDEO_RESOURCE_TYPE_DASH_PLAYREADY";
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_DASH_FAIRPLAY"] = "VIDEO_RESOURCE_TYPE_DASH_FAIRPLAY";
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_HLSV6_WIDEVINE"] = "VIDEO_RESOURCE_TYPE_HLSV6_WIDEVINE";
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_DASH"] = "VIDEO_RESOURCE_TYPE_DASH";
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_HLSV6_PLAYREADY"] = "VIDEO_RESOURCE_TYPE_HLSV6_PLAYREADY";
    VideoResourceTypeState["VIDEO_RESOURCE_TYPE_HLSV6_FAIRPLAY"] = "VIDEO_RESOURCE_TYPE_HLSV6_FAIRPLAY";
})(VideoResourceTypeState = exports.VideoResourceTypeState || (exports.VideoResourceTypeState = {}));
var VideoResolutionType;
(function (VideoResolutionType) {
    VideoResolutionType["VIDEO_RESOLUTION_UNKNOWN"] = "VIDEO_RESOLUTION_UNKNOWN";
    VideoResolutionType["VIDEO_RESOLUTION_AUTO"] = "VIDEO_RESOLUTION_AUTO";
    VideoResolutionType["VIDEO_RESOLUTION_240P"] = "VIDEO_RESOLUTION_240P";
    VideoResolutionType["VIDEO_RESOLUTION_360P"] = "VIDEO_RESOLUTION_360P";
    VideoResolutionType["VIDEO_RESOLUTION_480P"] = "VIDEO_RESOLUTION_480P";
    VideoResolutionType["VIDEO_RESOLUTION_576P"] = "VIDEO_RESOLUTION_576P";
    VideoResolutionType["VIDEO_RESOLUTION_720P"] = "VIDEO_RESOLUTION_720P";
    VideoResolutionType["VIDEO_RESOLUTION_1080P"] = "VIDEO_RESOLUTION_1080P";
    VideoResolutionType["VIDEO_RESOLUTION_2160P"] = "VIDEO_RESOLUTION_2160P";
})(VideoResolutionType = exports.VideoResolutionType || (exports.VideoResolutionType = {}));
//# sourceMappingURL=playerEvent.js.map