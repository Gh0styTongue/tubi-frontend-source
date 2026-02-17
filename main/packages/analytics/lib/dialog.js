"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogAction = exports.DialogType = void 0;
// https://github.com/adRise/protos/blob/46ef2d3c039107c1b5a3029252340f910f11e531/analytics/events.proto#L1013
var DialogType;
(function (DialogType) {
    DialogType["STILL_WATCHING"] = "STILL_WATCHING";
    DialogType["NETWORK_ERROR"] = "NETWORK_ERROR";
    DialogType["CONTENT_NOT_FOUND"] = "CONTENT_NOT_FOUND";
    DialogType["REGISTRATION"] = "REGISTRATION";
    DialogType["ADD_TO_QUEUE"] = "ADD_TO_QUEUE";
    DialogType["SIGNIN_REQUIRED"] = "SIGNIN_REQUIRED";
    DialogType["EXIT"] = "EXIT";
    DialogType["ENTER_KIDS_MODE"] = "ENTER_KIDS_MODE";
    DialogType["EXIT_KIDS_MODE"] = "EXIT_KIDS_MODE";
    DialogType["INFORMATION"] = "INFORMATION";
    DialogType["PLAYER_ERROR"] = "PLAYER_ERROR";
    DialogType["BIRTHDAY"] = "BIRTHDAY";
    DialogType["ACTIVATION"] = "ACTIVATION";
    DialogType["UPGRADE"] = "UPGRADE";
    DialogType["PIN_APP"] = "PIN_APP";
    DialogType["LOGIN_REQUEST"] = "LOGIN_REQUEST";
    DialogType["PROGRAM_INFORMATION"] = "PROGRAM_INFORMATION";
    DialogType["TOAST"] = "TOAST";
    DialogType["EXTENDED_CONTENT_TILE"] = "EXTENDED_CONTENT_TILE";
    DialogType["SUBTITLE_AUDIO"] = "SUBTITLE_AUDIO";
    DialogType["VIDEO_QUALITY"] = "VIDEO_QUALITY";
    DialogType["DEVICE_PERMISSIONS"] = "DEVICE_PERMISSIONS";
    DialogType["YOUR_PRIVACY"] = "YOUR_PRIVACY";
    DialogType["PRIVACY_PREFERENCES"] = "PRIVACY_PREFERENCES";
    DialogType["SWEEPSTAKES"] = "SWEEPSTAKES";
})(DialogType = exports.DialogType || (exports.DialogType = {}));
var DialogAction;
(function (DialogAction) {
    DialogAction["UNKNOWN_ACTION"] = "UNKNOWN_ACTION";
    DialogAction["SHOW"] = "SHOW";
    DialogAction["DISMISS_DELIBERATE"] = "DISMISS_DELIBERATE";
    DialogAction["DISMISS_AUTO"] = "DISMISS_AUTO";
    DialogAction["ACCEPT_DELIBERATE"] = "ACCEPT_DELIBERATE";
    DialogAction["ACCEPT_AUTO"] = "ACCEPT_AUTO";
})(DialogAction = exports.DialogAction || (exports.DialogAction = {}));
//# sourceMappingURL=dialog.js.map