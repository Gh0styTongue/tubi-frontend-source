"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HlsForwardFlush = void 0;
/**
 * As of hlsjs 1.5.0 there is built-in support
 * for removing buffered ranges ahead of a configured
 * amount. For our hls 1.2.7 this class attempts to
 * mimic that functionality.
 *
 * Currently only used for PS4. To detect PS4 the user agent
 * is sniffed. A PS4 that supports MSE/EME will have the string
 * 'WebMAF/v3' in it's user agent.
 */
var HlsForwardFlush = /** @class */ (function () {
    function HlsForwardFlush(hls, ExternalHls, videoElement) {
        var _this = this;
        this.hls = hls;
        this.ExternalHls = ExternalHls;
        this.videoElement = videoElement;
        this.flushes = {
            audio: [],
            video: [],
        };
        this.frontBufferFlushThreshold = 60;
        this.onBufferFlushing = function (_event, data) {
            if (!_this.isAudioOrVideo(data.type)) {
                return;
            }
            _this.flushes[data.type].push(
            // 1.2.7 uses 0 for it's flushes
            data.startOffset === 0);
        };
        this.onBufferFlushed = function (_event, data) {
            if (!_this.isAudioOrVideo(data.type)) {
                return;
            }
            _this.flushes[data.type].shift();
        };
        this.onFragChanged = function (_event, data) {
            if (data.frag.type !== 'audio' && data.frag.type !== 'main') {
                return;
            }
            var sourceBufferType = data.frag.type === 'audio' ? 'audio' : 'video';
            var forwardThreshold = _this.videoElement.currentTime + _this.frontBufferFlushThreshold;
            var typeBuffered = _this.hls["".concat(sourceBufferType, "Buffered")];
            // avoid sending multiple forward flush requests
            if (typeBuffered === undefined || _this.flushes[sourceBufferType].indexOf(false) !== -1) {
                return;
            }
            for (var i = 0; i < typeBuffered.length; i++) {
                var buffered = typeBuffered.start(i);
                if (
                // is this range very far ahead
                buffered > forwardThreshold ||
                    // at least on PS4 there can be ranges of a few seconds that get created while seeking
                    // for these regions behind the playhead they should be removed by the flush back from hls
                    (i > 0 && buffered > _this.videoElement.currentTime && buffered - typeBuffered.end(i - 1) >= 1)) {
                    _this.hls.trigger(_this.ExternalHls.Events.BUFFER_FLUSHING, {
                        startOffset: Math.floor(buffered),
                        endOffset: Math.ceil(_this.videoElement.duration),
                        type: sourceBufferType,
                    });
                    break;
                }
            }
        };
    }
    HlsForwardFlush.prototype.isAudioOrVideo = function (type) {
        return type === 'audio' || type === 'video';
    };
    HlsForwardFlush.prototype.setup = function (_a) {
        var frontBufferFlushThreshold = _a.frontBufferFlushThreshold;
        if (this.ExternalHls.version.indexOf('1.2.7') !== 0 || typeof frontBufferFlushThreshold === 'undefined') {
            return;
        }
        this.frontBufferFlushThreshold = frontBufferFlushThreshold;
        this.hls.on(this.ExternalHls.Events.BUFFER_FLUSHING, this.onBufferFlushing);
        this.hls.on(this.ExternalHls.Events.BUFFER_FLUSHED, this.onBufferFlushed);
        this.hls.on(this.ExternalHls.Events.FRAG_CHANGED, this.onFragChanged);
    };
    HlsForwardFlush.prototype.destroy = function () {
        this.hls.off(this.ExternalHls.Events.BUFFER_FLUSHING, this.onBufferFlushing);
        this.hls.off(this.ExternalHls.Events.BUFFER_FLUSHED, this.onBufferFlushed);
        this.hls.off(this.ExternalHls.Events.FRAG_CHANGED, this.onFragChanged);
    };
    return HlsForwardFlush;
}());
exports.HlsForwardFlush = HlsForwardFlush;
//# sourceMappingURL=hlsForwardFlush.js.map