"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var abrController_1 = require("../abrController");
// From dash.js https://dashif.org/dash.js/pages/usage/abr/throughput-rule.html
var ThroughputRule = /** @class */ (function () {
    function ThroughputRule() {
    }
    ThroughputRule.prototype.getSwitchRequestResult = function (abrController) {
        var currentBufferState = abrController.getBufferState();
        var throughput = abrController.getThroughput() / 1000.0; // kbit/s
        var latency = abrController.getLatency();
        var levels = abrController.getHls().levels;
        var switchRequestResult = {
            rule: this.constructor.name,
            level: undefined,
        };
        if (currentBufferState === abrController_1.BufferState.BUFFER_LOADED) {
            // Find a level which bitrate is closest to the throughput
            switchRequestResult.level = abrController.getOptimalLevelForBitrate(throughput);
            switchRequestResult.reason = {
                throughput: throughput,
                latency: latency,
                message: "[ThroughputRule]: Switching to level with bitrate ".concat(switchRequestResult.level ?
                    levels[switchRequestResult.level].bitrate / 1000.0 : 'n/a', " kbit/s. Throughput: ").concat(throughput, " kbit/s"),
            };
        }
        return switchRequestResult;
    };
    return ThroughputRule;
}());
exports.default = ThroughputRule;
//# sourceMappingURL=throughputRule.js.map