"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdPlaybackHealthChecker = void 0;
var time_1 = require("@adrise/utils/lib/time");
// Define weights for different health check components
var weights = {
    timeUpdate: 0.35,
    currentTime: 0.5,
    bufferGrowth: 0.15,
    frequentPausePenalty: 0.1,
};
var FREQ_PAUSE_PENALTY_THRESHOLD = 3;
var HEALTH_CHECK_INTERVAL = 5000;
var IDEAL_TIMEUPDATE_COUNT = 4;
var DEFAULT_HEALTH_THRESHOLD = 0.6;
var AdPlaybackHealthChecker = /** @class */ (function () {
    function AdPlaybackHealthChecker(videoElement, _a) {
        var _b = _a.checkInterval, checkInterval = _b === void 0 ? HEALTH_CHECK_INTERVAL : _b, _c = _a.healthThreshold, healthThreshold = _c === void 0 ? DEFAULT_HEALTH_THRESHOLD : _c, onHealthScoreLow = _a.onHealthScoreLow;
        var _this = this;
        this.scores = {
            timeUpdate: -1,
            currentTime: -1,
            bufferGrowth: -1,
            total: -1,
            stallCount: 0,
            waitingCount: 0,
            pauseCount: 0,
        };
        this.scoreHistory = [];
        this.maxHistoryLength = 10; // Keep the last 10 scores for averaging
        this.onTimeUpdate = function () {
            _this.timeUpdateCount++;
        };
        this.onWaiting = function () {
            _this.totalWaitingCount++;
        };
        this.onStall = function () {
            _this.totalStallCount++;
        };
        this.onVolumeChange = function () {
            _this.volumeChangeCount++;
        };
        this.onPause = function () {
            _this.pauseCount++;
            _this.totalPauseCount++;
        };
        this.checkHealth = function () {
            if (!_this.videoElement) {
                return;
            }
            _this.checkCount++;
            // Handle paused state
            if (_this.videoElement.paused && !_this.videoElement.error) {
                _this.lastCheckTime = _this.videoElement.currentTime;
                _this.lastBufferedEnd = _this.getBufferedEnd();
                _this.lastCheckRealTime = Date.now();
                return;
            }
            var currentTime = _this.videoElement.currentTime;
            var now = Date.now();
            var realTimeDuration = (now - _this.lastCheckRealTime) / (0, time_1.secs)(1); // Convert to seconds
            var expectedTime = _this.lastCheckTime + realTimeDuration;
            var timeDiff = expectedTime - currentTime;
            var bufferedEnd = _this.getBufferedEnd();
            var bufferGrowth = bufferedEnd - _this.lastBufferedEnd;
            var adDuration = _this.videoElement.duration;
            // Calculate timeUpdate score: 2 timeupdate per second is perfect for now, we can keep tuning this
            var timeUpdateScore = Math.min(_this.timeUpdateCount / (realTimeDuration * IDEAL_TIMEUPDATE_COUNT), 1) * weights.timeUpdate;
            // Calculate currentTime score: Assess how closely playback time matches expected time
            var currentTimeScore = _this.calculateCurrentTimeScore(timeDiff, realTimeDuration) * weights.currentTime;
            // Calculate bufferGrowth score: Evaluate buffer growth rate, accounting for near-end scenarios
            var bufferGrowthScore = _this.calculateBufferGrowthScore(bufferGrowth, realTimeDuration, adDuration, bufferedEnd) * weights.bufferGrowth;
            // Prepare currentScores object with individual component scores
            var currentScores = {
                timeUpdate: timeUpdateScore,
                currentTime: currentTimeScore,
                bufferGrowth: bufferGrowthScore,
                total: -1,
                stallCount: 0,
                waitingCount: 0,
                pauseCount: 0,
            };
            // Add current scores to history and maintain max history length
            _this.scoreHistory.push(currentScores);
            if (_this.scoreHistory.length > _this.maxHistoryLength) {
                _this.scoreHistory.shift(); // Remove the oldest score
            }
            // Calculate average scores
            _this.scores = _this.calculateAverageScores();
            _this.scores.history = _this.getScoreHistoryCSV();
            // Calculate frequent pause penalty
            var frequentPausePenalty = Math.max(0, (_this.totalPauseCount - FREQ_PAUSE_PENALTY_THRESHOLD) * weights.frequentPausePenalty);
            if (frequentPausePenalty > 0) {
                _this.scores.pausePenalty = frequentPausePenalty;
            }
            _this.scores.total = Math.max(0, _this.scores.total - frequentPausePenalty);
            _this.scores.stallCount = _this.totalStallCount;
            _this.scores.waitingCount = _this.totalWaitingCount;
            _this.scores.pauseCount = _this.totalPauseCount;
            var currentHealthScore = timeUpdateScore + currentTimeScore + bufferGrowthScore - frequentPausePenalty;
            var totalHealthScore = _this.scores.total - frequentPausePenalty;
            var weightedHealthScore = totalHealthScore * 0.3 + currentHealthScore * 0.7;
            if (_this.scoreHistory.length > 1 && // First score is not reliable because it includes the first frame duration.
                weightedHealthScore < _this.healthThreshold &&
                timeUpdateScore < 0.2 &&
                currentTimeScore < 0.3) {
                if (_this.onHealthScoreLow) {
                    _this.onHealthScoreLow(weightedHealthScore);
                }
            }
            // Update state for next check
            _this.lastCheckTime = currentTime;
            _this.lastBufferedEnd = bufferedEnd;
            _this.lastCheckRealTime = now;
            _this.timeUpdateCount = 0;
        };
        this.videoElement = videoElement;
        this.checkInterval = checkInterval;
        this.healthThreshold = healthThreshold;
        this.onHealthScoreLow = onHealthScoreLow;
        this.checkCount = 0;
        this.timeUpdateCount = 0;
        this.lastCheckTime = 0;
        this.lastBufferedEnd = 0;
        this.totalStallCount = 0;
        this.totalWaitingCount = 0;
        this.pauseCount = 0;
        this.volumeChangeCount = 0;
        this.totalPauseCount = 0;
        this.intervalId = undefined;
        this.lastCheckRealTime = Date.now();
    }
    AdPlaybackHealthChecker.prototype.start = function () {
        if (!this.videoElement || this.intervalId !== undefined) {
            return;
        }
        this.lastCheckTime = this.videoElement.currentTime;
        this.lastBufferedEnd = this.getBufferedEnd();
        this.videoElement.addEventListener('timeupdate', this.onTimeUpdate);
        this.videoElement.addEventListener('waiting', this.onWaiting);
        this.videoElement.addEventListener('stalled', this.onStall);
        this.videoElement.addEventListener('volumechange', this.onVolumeChange);
        this.videoElement.addEventListener('pause', this.onPause);
        this.intervalId = setInterval(this.checkHealth, this.checkInterval);
    };
    AdPlaybackHealthChecker.prototype.stop = function () {
        if (!this.videoElement) {
            return;
        }
        this.videoElement.removeEventListener('timeupdate', this.onTimeUpdate);
        this.videoElement.removeEventListener('waiting', this.onWaiting);
        this.videoElement.removeEventListener('stalled', this.onStall);
        this.videoElement.removeEventListener('volumechange', this.onVolumeChange);
        this.videoElement.removeEventListener('pause', this.onPause);
        clearInterval(this.intervalId);
        this.intervalId = undefined;
    };
    AdPlaybackHealthChecker.prototype.getBufferedEnd = function () {
        if (!this.videoElement) {
            return 0;
        }
        var buffered = this.videoElement.buffered;
        return buffered.length ? buffered.end(buffered.length - 1) : 0;
    };
    // Calculate average scores from score history
    AdPlaybackHealthChecker.prototype.calculateAverageScores = function () {
        var sum = {
            timeUpdate: 0,
            currentTime: 0,
            bufferGrowth: 0,
            total: 0,
            stallCount: 0,
            waitingCount: 0,
            pauseCount: 0,
        };
        for (var _i = 0, _a = this.scoreHistory; _i < _a.length; _i++) {
            var score = _a[_i];
            sum.timeUpdate += score.timeUpdate;
            sum.currentTime += score.currentTime;
            sum.bufferGrowth += score.bufferGrowth;
        }
        var count = this.scoreHistory.length;
        return {
            timeUpdate: Number((sum.timeUpdate / count).toFixed(2)),
            currentTime: Number((sum.currentTime / count).toFixed(2)),
            bufferGrowth: Number((sum.bufferGrowth / count).toFixed(2)),
            total: Number(((sum.bufferGrowth + sum.currentTime + sum.timeUpdate) / count).toFixed(2)),
            stallCount: 0,
            waitingCount: 0,
            pauseCount: 0,
        };
    };
    // Calculate score for current time progression
    AdPlaybackHealthChecker.prototype.calculateCurrentTimeScore = function (timeDiff, expectedDuration) {
        return Math.max(0, 1 - timeDiff / expectedDuration);
    };
    // Calculate score for buffer growth
    AdPlaybackHealthChecker.prototype.calculateBufferGrowthScore = function (bufferGrowth, realTimeDuration, adDuration, bufferedEnd) {
        var isBufferCloseToDuration = bufferedEnd >= adDuration - 1; // Check if buffered end is close to the ad duration
        if (isBufferCloseToDuration) {
            return 1;
        }
        // Ensure non-negative score
        var growthRate = Math.max(0, bufferGrowth / realTimeDuration);
        return Math.min(growthRate, 1);
    };
    AdPlaybackHealthChecker.prototype.getScores = function () {
        return this.scores;
    };
    /**
       * Use this to get the score history in CSV format.
       * example output:
       * timeUpdate,currentTime,bufferGrowth
       * 0.25,0.35,0.25
       * 0.22,0.31,0.21
       * ...
       * @returns CSV string of score history
       */
    AdPlaybackHealthChecker.prototype.getScoreHistoryCSV = function () {
        var headers = ['timeUpdate', 'currentTime', 'bufferGrowth'];
        var csvRows = [headers.join(',')];
        for (var _i = 0, _a = this.scoreHistory; _i < _a.length; _i++) {
            var score = _a[_i];
            var row = [
                score.timeUpdate.toFixed(2),
                score.currentTime.toFixed(2),
                score.bufferGrowth.toFixed(2),
            ];
            csvRows.push(row.join(','));
        }
        return csvRows.join('\n');
    };
    AdPlaybackHealthChecker.prototype.destroy = function () {
        this.stop();
        this.videoElement = undefined;
        this.checkInterval = 0;
        this.healthThreshold = 0;
        this.checkCount = 0;
        this.timeUpdateCount = 0;
        this.lastCheckTime = 0;
        this.lastBufferedEnd = 0;
        this.totalStallCount = 0;
        this.totalWaitingCount = 0;
        this.pauseCount = 0;
        this.volumeChangeCount = 0;
        this.intervalId = undefined;
        this.scores = {
            timeUpdate: -1,
            currentTime: -1,
            bufferGrowth: -1,
            total: -1,
            stallCount: 0,
            waitingCount: 0,
            pauseCount: 0,
        };
        this.totalPauseCount = 0;
        this.scoreHistory = [];
    };
    return AdPlaybackHealthChecker;
}());
exports.AdPlaybackHealthChecker = AdPlaybackHealthChecker;
//# sourceMappingURL=adHealthChecker.js.map