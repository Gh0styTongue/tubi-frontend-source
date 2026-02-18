"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseAudioTracks = void 0;
var audioTrack_1 = require("./audioTrack");
function domParserVersion(dash) {
    var parser = new DOMParser();
    var d = parser.parseFromString(dash, 'text/xml');
    var adaptationSets = d.getElementsByTagName('AdaptationSet');
    var results = [];
    for (var i = 0, length_1 = adaptationSets.length; i < length_1; i++) {
        var adaptationSet = adaptationSets[i];
        if (adaptationSet.getAttribute('contentType') !== 'audio') {
            continue;
        }
        var roles = adaptationSet.getElementsByTagName('Role');
        if (roles.length === 0) {
            continue;
        }
        results.push({
            id: (0, audioTrack_1.toNumber)(adaptationSet.getAttribute('id')),
            language: String(adaptationSet.getAttribute('lang')),
            role: (0, audioTrack_1.getRole)(String(roles[0].getAttribute('value'))),
            label: String(adaptationSet.getAttribute('label')),
        });
    }
    return results;
}
function parseAudioTracks(dash) {
    return domParserVersion(dash);
}
exports.parseAudioTracks = parseAudioTracks;
//# sourceMappingURL=dash.js.map