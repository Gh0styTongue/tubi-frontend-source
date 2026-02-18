"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var abrController_1 = require("../abrController");
var THROUGHPUT_SAFETY_FACTOR = 0.7;
var MAX_FRAGS_APPEND_COUNT_TO_IGNORE_RULE = 2;
// From dash.js https://dashif.org/dash.js/pages/usage/abr/insufficient-buffer-rule.html
var InsufficientBufferRule = /** @class */ (function () {
    function InsufficientBufferRule() {
        this.reset();
    }
    InsufficientBufferRule.prototype.getSwitchRequestResult = function (abrController) {
        var _a;
        var currentBufferState = abrController.getBufferState();
        var hls = abrController.getHls();
        var levels = hls.levels;
        var fragmentDuration = (_a = levels[hls.loadLevel].details) === null || _a === void 0 ? void 0 : _a.targetduration;
        var switchRequestResult = {
            rule: this.constructor.name,
            level: undefined,
        };
        if (!fragmentDuration || !this._shouldExecuteRule()) {
            return switchRequestResult;
        }
        // Buffer is empty, switch to lowest level
        if (currentBufferState && currentBufferState === abrController_1.BufferState.BUFFER_EMPTY) {
            switchRequestResult.level = abrController.getOptimalLevelForBitrate(0);
            switchRequestResult.reason = {
                message: '[InsufficientBufferRule]: Switching to lowest level because buffer is empty',
            };
        }
        else {
            var bufferLevel = abrController.getBufferLevel(); // seconds
            var throughput = abrController.getThroughput() / 1000; // kbits per second
            // Calculate a safe maximum bitrate limit
            var safeThroughput = throughput * THROUGHPUT_SAFETY_FACTOR;
            // Calculate the maximum bitrate that can be safely used
            // To avoid buffer underrun, we must complete the download of the next fragment before the current buffer data runs out
            var bitrate = safeThroughput * bufferLevel / fragmentDuration;
            if (isNaN(bitrate) || bitrate <= 0) {
                return switchRequestResult;
            }
            // Get the optimal level for the bitrate
            switchRequestResult.level = abrController.getOptimalLevelForBitrate(bitrate);
            switchRequestResult.reason = {
                message: "[InsufficientBufferRule]: Limiting maximum bitrate with level bitrate ".concat(levels[switchRequestResult.level].bitrate / 1000.0, " kbit/s to avoid a buffer underrun."),
                bitrate: bitrate,
            };
        }
        return switchRequestResult;
    };
    InsufficientBufferRule.prototype.reset = function () {
        // Start the rule when appended the first few fragments after startup/seek
        this.fragsNeedToAppendBeforeExecuteRule = MAX_FRAGS_APPEND_COUNT_TO_IGNORE_RULE;
    };
    InsufficientBufferRule.prototype.onSeeking = function () {
        this.reset();
    };
    InsufficientBufferRule.prototype.onBufferAppended = function (data) {
        if (data.frag.type === 'main') {
            if (this.fragsNeedToAppendBeforeExecuteRule > 0) {
                this.fragsNeedToAppendBeforeExecuteRule--;
            }
        }
    };
    InsufficientBufferRule.prototype._shouldExecuteRule = function () {
        // We don't execute the rule if the buffer is empty caused by startup or seek
        // So we start the rule when appended the first few fragments after startup/seek
        return this.fragsNeedToAppendBeforeExecuteRule <= 0;
    };
    return InsufficientBufferRule;
}());
exports.default = InsufficientBufferRule;
//# sourceMappingURL=insufficientBufferRule.js.map