"use strict";
/**
 * We use prefix 'el' to mark it's a video element event
 * use prefix 'hls' to mark it's a hls.js event
 * TODO:
 * The events in timeupdate cannot be described in a proper way
 * We might need to remove some of them after we find out if everyone of them would be trigger
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StopBufferingReason = void 0;
var StopBufferingReason;
(function (StopBufferingReason) {
    StopBufferingReason["el_canplay_event"] = "el_canplay_event";
    StopBufferingReason["el_play_event"] = "el_play_event";
    StopBufferingReason["el_pause_event"] = "el_pause_event";
    StopBufferingReason["el_timeupdate_event_1"] = "el_timeupdate_event_1";
    StopBufferingReason["el_timeupdate_event_2"] = "el_timeupdate_event_2";
    StopBufferingReason["el_timeupdate_event_3"] = "el_timeupdate_event_3";
    StopBufferingReason["el_ended_event"] = "el_ended_event";
    StopBufferingReason["player_exit"] = "player_exit";
    StopBufferingReason["hls_frag_buffered_event"] = "hls_frag_buffered_event";
    StopBufferingReason["avplay_buffering_complete_event"] = "avplay_buffering_complete_event";
    StopBufferingReason["seek_start"] = "seek_start";
    StopBufferingReason["content_start_load"] = "content_start_load";
    StopBufferingReason["ad_start_load"] = "ad_start_load";
    StopBufferingReason["one_playback_end"] = "one_playback_end";
    StopBufferingReason["adplayer_exit"] = "adplayer_exit";
})(StopBufferingReason = exports.StopBufferingReason || (exports.StopBufferingReason = {}));
//# sourceMappingURL=stopBufferingReason.js.map