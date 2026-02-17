"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaybackSourceType = exports.InputDeviceType = exports.Channel = exports.Action = exports.Operation = exports.CastType = exports.SearchType = void 0;
var SearchType;
(function (SearchType) {
    SearchType["UNKNOWN"] = "UNKNOWN";
    SearchType["BAR"] = "BAR";
    SearchType["PAGE"] = "PAGE";
    SearchType["CLEAR"] = "CLEAR";
})(SearchType = exports.SearchType || (exports.SearchType = {}));
var CastType;
(function (CastType) {
    CastType["UNKNOWN"] = "UNKNOWN";
    CastType["CHROMECAST"] = "CHROMECAST";
})(CastType = exports.CastType || (exports.CastType = {}));
var Operation;
(function (Operation) {
    Operation["ADD_TO_QUEUE"] = "ADD_TO_QUEUE";
    Operation["REMOVE_FROM_QUEUE"] = "REMOVE_FROM_QUEUE";
    Operation["REMOVE_FROM_CONTINUE_WATCHING"] = "REMOVE_FROM_CONTINUE_WATCHING";
})(Operation = exports.Operation || (exports.Operation = {}));
var Action;
(function (Action) {
    Action["CLICK"] = "CLICK";
    Action["SHARE"] = "SHARE";
})(Action = exports.Action || (exports.Action = {}));
var Channel;
(function (Channel) {
    Channel["FACEBOOK"] = "FACEBOOK";
    Channel["TWITTER"] = "TWITTER";
    Channel["UNKNOWN_CHANNEL"] = "UNKNOWN_CHANNEL";
})(Channel = exports.Channel || (exports.Channel = {}));
// https://github.com/adRise/protos/blob/5fc8fde491fbb977ff2addcd67a40189fbdb7f15/analytics/client.proto#L250-L258
var InputDeviceType;
(function (InputDeviceType) {
    // unspecified device, most probably native.
    InputDeviceType["UNKNOWN_DEVICE"] = "UNKNOWN_DEVICE";
    // the native keyboard (sometimes virtual) for the device.
    InputDeviceType["NATIVE"] = "NATIVE";
    // an external keyboard attached to the OTT device.
    InputDeviceType["KEYBOARD"] = "KEYBOARD";
    // voice command
    InputDeviceType["VOICE"] = "VOICE";
})(InputDeviceType = exports.InputDeviceType || (exports.InputDeviceType = {}));
var PlaybackSourceType;
(function (PlaybackSourceType) {
    PlaybackSourceType["UNKNOWN_PLAYBACK_SOURCE"] = "UNKNOWN_PLAYBACK_SOURCE";
    PlaybackSourceType["AUTOPLAY_AUTOMATIC"] = "AUTOPLAY_AUTOMATIC";
    PlaybackSourceType["AUTOPLAY_DELIBERATE"] = "AUTOPLAY_DELIBERATE";
    PlaybackSourceType["VIDEO_PREVIEWS"] = "VIDEO_PREVIEWS";
    PlaybackSourceType["AUTOPLAY_FROM_TRAILER"] = "AUTOPLAY_FROM_TRAILER"; // the title started automatically after trailer play end
})(PlaybackSourceType = exports.PlaybackSourceType || (exports.PlaybackSourceType = {}));
//# sourceMappingURL=genericEvents.js.map