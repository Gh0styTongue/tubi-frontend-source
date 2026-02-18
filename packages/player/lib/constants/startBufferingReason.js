"use strict";
/**
 * We use prefix 'el' to mark it's a video element event
 * use prefix 'hls' to mark it's a hls.js event
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StartBufferingReason = void 0;
var StartBufferingReason;
(function (StartBufferingReason) {
    StartBufferingReason["el_load_start"] = "el_load_start";
    StartBufferingReason["el_waiting_event"] = "el_waiting_event";
    StartBufferingReason["el_ready_state_abnormal"] = "el_ready_state_abnormal";
    StartBufferingReason["hls_buffer_stall_event"] = "hls_buffer_stall_event";
    StartBufferingReason["avplay_buffering_begin_event"] = "avplay_buffering_begin_event";
})(StartBufferingReason = exports.StartBufferingReason || (exports.StartBufferingReason = {}));
//# sourceMappingURL=startBufferingReason.js.map