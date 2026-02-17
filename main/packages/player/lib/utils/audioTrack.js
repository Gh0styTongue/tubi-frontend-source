"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertHLSAudioTrackToAudioTrackInfo = exports.isSameHTML5AudioTrack = exports.convertHTML5AudioTrackToAudioTrackInfo = exports.getRole = exports.toNumber = void 0;
var toNumber = function (id) {
    return id === '' || id === null || isNaN(Number(id)) ? -1 : Number(id);
};
exports.toNumber = toNumber;
function getRole(role) {
    var lowercaseRole = role.toLowerCase();
    if (lowercaseRole === 'description' || lowercaseRole === 'public.accessibility.describes-video') {
        return 'description';
    }
    if (lowercaseRole === 'main') {
        return 'main';
    }
    // eslint-disable-next-line no-console
    console.warn("[Player:audioTrack.ts] Unknown role \"".concat(role, "\" detected when decorating AudioTrackInfo: assuming as main"));
    return 'main';
}
exports.getRole = getRole;
function convertHTML5AudioTrackToAudioTrackInfo(track) {
    return {
        id: (0, exports.toNumber)(track.id),
        language: track.language,
        role: getRole(track.kind),
        label: track.label,
        active: track.enabled,
    };
}
exports.convertHTML5AudioTrackToAudioTrackInfo = convertHTML5AudioTrackToAudioTrackInfo;
function isSameHTML5AudioTrack(track, info) {
    return info.id === (0, exports.toNumber)(track.id)
        && track.language === info.language
        && track.kind === info.role;
}
exports.isSameHTML5AudioTrack = isSameHTML5AudioTrack;
function convertHLSAudioTrackToAudioTrackInfo(track, activeId) {
    return {
        id: track.id,
        language: track.lang,
        role: getRole(track.attrs.CHARACTERISTICS || 'main'),
        label: track.name,
        active: track.id === activeId,
    };
}
exports.convertHLSAudioTrackToAudioTrackInfo = convertHLSAudioTrackToAudioTrackInfo;
//# sourceMappingURL=audioTrack.js.map