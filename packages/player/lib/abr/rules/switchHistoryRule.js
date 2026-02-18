"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var switchRequestHistory_1 = require("../switchRequestHistory");
// From dash.js https://dashif.org/dash.js/pages/usage/abr/switch-history-rule.html
var SwitchHistoryRule = /** @class */ (function () {
    function SwitchHistoryRule() {
    }
    SwitchHistoryRule.prototype.getSwitchRequestResult = function (abrController) {
        var switchRequestHistory = abrController.getSwitchRequestHistory();
        var switchRequests = switchRequestHistory.getSwitchRequests();
        var hls = abrController.getHls();
        var minAutoLevel = hls.minAutoLevel, maxAutoLevel = hls.maxAutoLevel;
        var switchRequestResult = {
            rule: this.constructor.name,
            level: undefined,
        };
        var drops = 0;
        var noDrops = 0;
        for (var i = minAutoLevel; i <= maxAutoLevel; i++) {
            if (switchRequests[i]) {
                // Why accumulate statistics instead of looking only at the current level?
                // Because player may repeatedly switch between multiple higher levels.
                // Drops/noDrops statistics from a single level alone can't accurately reflect instability across all higher bitrate levels.
                // By aggregating data across multiple levels, we can better assess whether the overall "medium-to-high bitrate region" is generally unstable,
                // providing greater confidence in deciding to switch down.
                drops += switchRequests[i].drops;
                noDrops += switchRequests[i].noDrops;
                // Check if we have enough samples and if the ratio of drops to no-drops exceeds threshold
                if (drops + noDrops >= switchRequestHistory_1.MAX_SWITCH_HISTORY_SAMPLE_SIZE && (drops / noDrops > switchRequestHistory_1.SWITCH_PERCENTAGE_THRESHOLD)) {
                    switchRequestResult.level = (i > minAutoLevel && switchRequests[i].drops > 0) ? i - 1 : i;
                    switchRequestResult.reason = {
                        drops: drops,
                        noDrops: noDrops,
                        message: "[SwitchHistoryRule]: Switch to index: ".concat(switchRequestResult.level, " samples: ").concat((drops + noDrops), " drops:  ").concat(drops),
                    };
                    break;
                }
            }
        }
        return switchRequestResult;
    };
    return SwitchHistoryRule;
}());
exports.default = SwitchHistoryRule;
//# sourceMappingURL=switchHistoryRule.js.map