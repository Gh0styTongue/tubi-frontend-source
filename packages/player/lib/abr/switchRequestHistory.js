"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SWITCH_PERCENTAGE_THRESHOLD = exports.MAX_SWITCH_HISTORY_SAMPLE_SIZE = void 0;
exports.MAX_SWITCH_HISTORY_SAMPLE_SIZE = 8;
exports.SWITCH_PERCENTAGE_THRESHOLD = 0.3;
// From dash.js
var SwitchRequestHistory = /** @class */ (function () {
    function SwitchRequestHistory() {
        this.switchRequests = {};
        this.switchRequestHistory = [];
    }
    SwitchRequestHistory.prototype._initializeForLevel = function (level) {
        this.switchRequests[level] = {
            noDrops: 0,
            drops: 0,
            dropSize: 0,
        };
    };
    SwitchRequestHistory.prototype.push = function (currentLevel, nextLevel) {
        if (!this.switchRequests[currentLevel]) {
            this._initializeForLevel(currentLevel);
        }
        // Set switch details
        var indexDiff = nextLevel - currentLevel;
        var drop = (indexDiff < 0) ? 1 : 0;
        var dropSize = drop ? -indexDiff : 0;
        var noDrop = drop ? 0 : 1;
        // Update running totals
        this.switchRequests[currentLevel].drops += drop;
        this.switchRequests[currentLevel].dropSize += dropSize;
        this.switchRequests[currentLevel].noDrops += noDrop;
        // Save to history
        this.switchRequestHistory.push({
            level: currentLevel,
            noDrop: noDrop,
            drop: drop,
            dropSize: dropSize,
        });
        // Remove outdated entries from history
        var removedHistorySample = this._adjustSwitchRequestHistory();
        // Adjust current values based on the removed sample
        if (removedHistorySample) {
            this._adjustSwitchRequestDrops(removedHistorySample);
        }
    };
    SwitchRequestHistory.prototype._adjustSwitchRequestHistory = function () {
        // Shift the earliest switch off srHistory and readjust to keep depth of running totals constant
        if (this.switchRequestHistory.length > exports.MAX_SWITCH_HISTORY_SAMPLE_SIZE) {
            return this.switchRequestHistory.shift();
        }
        return null;
    };
    SwitchRequestHistory.prototype._adjustSwitchRequestDrops = function (removedHistorySample) {
        this.switchRequests[removedHistorySample.level].drops -= removedHistorySample.drop;
        this.switchRequests[removedHistorySample.level].dropSize -= removedHistorySample.dropSize;
        this.switchRequests[removedHistorySample.level].noDrops -= removedHistorySample.noDrop;
    };
    SwitchRequestHistory.prototype.getSwitchRequests = function () {
        return this.switchRequests;
    };
    SwitchRequestHistory.prototype.reset = function () {
        this.switchRequests = {};
        this.switchRequestHistory = [];
    };
    return SwitchRequestHistory;
}());
exports.default = SwitchRequestHistory;
//# sourceMappingURL=switchRequestHistory.js.map