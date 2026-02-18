"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveMuteState = exports.saveVolume = exports.getStoredMuteState = exports.getStoredVolume = void 0;
var localStorage_1 = require("@adrise/utils/lib/localStorage");
var constants_1 = require("../constants/constants");
/**
 * Get volume from localStorage
 * @returns Volume value or null
 */
var getStoredVolume = function () {
    try {
        var storedVolume = (0, localStorage_1.getLocalStorageData)(constants_1.PLAYER_STORAGE_VOLUME);
        return storedVolume ? JSON.parse(storedVolume) : null;
    }
    catch (e) {
        return null;
    }
};
exports.getStoredVolume = getStoredVolume;
/**
 * Get mute state from localStorage
 * @returns Mute state or false
 */
var getStoredMuteState = function () {
    try {
        var storedMute = (0, localStorage_1.getLocalStorageData)(constants_1.PLAYER_STORAGE_MUTE);
        return storedMute ? JSON.parse(storedMute) : false;
    }
    catch (e) {
        return false;
    }
};
exports.getStoredMuteState = getStoredMuteState;
/**
 * Save volume to localStorage
 * @param volume Volume value to save
 */
var saveVolume = function (volume) {
    (0, localStorage_1.setLocalStorageData)(constants_1.PLAYER_STORAGE_VOLUME, "".concat(volume));
};
exports.saveVolume = saveVolume;
/**
 * Save mute state to localStorage
 * @param isMuted Mute state to save
 */
var saveMuteState = function (isMuted) {
    (0, localStorage_1.setLocalStorageData)(constants_1.PLAYER_STORAGE_MUTE, "".concat(isMuted));
};
exports.saveMuteState = saveMuteState;
//# sourceMappingURL=volume.js.map