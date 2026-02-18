"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bufferingProgressTracker = void 0;
exports.createCustomLoaderClass = createCustomLoaderClass;
var tslib_1 = require("tslib");
/**
 * Creates a unique key for a fragment based on its type and properties
 * @param fragType - The type of fragment ('video' or 'audio')
 * @param frag - Fragment object with level, sn, and url properties
 * @returns A unique string key for the fragment
 */
function createFragmentKey(fragType, frag) {
    return "".concat(fragType, "-").concat(frag.level || 0, "-").concat(frag.sn || 0, "-").concat(frag.url || '');
}
var BufferingProgressTracker = /** @class */ (function () {
    function BufferingProgressTracker() {
        this.currentDownloads = {};
        this.pollingEnabled = true; // Default to enabled
    }
    BufferingProgressTracker.getInstance = function () {
        if (!BufferingProgressTracker.instance) {
            BufferingProgressTracker.instance = new BufferingProgressTracker();
        }
        return BufferingProgressTracker.instance;
    };
    /**
     * Enable polling for segment download progress
     * This should be called when buffering starts
     */
    BufferingProgressTracker.prototype.enablePolling = function () {
        this.pollingEnabled = true;
    };
    /**
     * Disable polling for segment download progress
     * This should be called when buffering ends
     */
    BufferingProgressTracker.prototype.disablePolling = function () {
        this.pollingEnabled = false;
    };
    /**
     * Check if polling is currently enabled
     */
    BufferingProgressTracker.prototype.isPollingEnabled = function () {
        return this.pollingEnabled;
    };
    /**
     * Initialize segment download tracking when fragment starts loading
     * This is called earlier than onProgress, when FRAG_LOADING event fires
     * @param frag - Fragment object from hls.js
     */
    BufferingProgressTracker.prototype.initializeSegmentTracking = function (frag) {
        // Ignore init segments and subtitles
        if (frag.sn === 'initSegment' || frag.type === 'subtitle') {
            return;
        }
        // Determine fragment type (video or audio)
        var fragType = frag.type === 'audio' ? 'audio' : 'video';
        if (frag.duration === undefined || frag.duration <= 0) {
            return;
        }
        // Get fragment start and end times
        var fragStart = frag.start !== undefined ? frag.start : 0;
        var fragEnd = fragStart + frag.duration;
        // Create unique key for this fragment
        var fragmentKey = createFragmentKey(fragType, frag);
        // Initialize segment download progress with 0 progress
        // This ensures the segment is tracked immediately when loading starts
        if (!(fragmentKey in this.currentDownloads)) {
            this.currentDownloads[fragmentKey] = {
                type: fragType,
                duration: frag.duration,
                start: fragStart,
                end: fragEnd,
                downloadProgress: 0,
                lastUpdateTime: Date.now(),
            };
        }
    };
    /**
     * Update segment download progress
     * @param context - Loader context that may contain fragment info
     * @param stats - Download stats with loaded and total bytes
     */
    BufferingProgressTracker.prototype.updateSegmentProgress = function (context, stats) {
        var _this = this;
        // Check if this is a fragment loader context
        var fragContext = context;
        if (!fragContext || !fragContext.frag) {
            return;
        }
        var frag = fragContext.frag;
        // Ignore init segments and subtitles
        if (frag.sn === 'initSegment' || frag.type === 'subtitle') {
            return;
        }
        // Determine fragment type (video or audio)
        var fragType = frag.type === 'audio' ? 'audio' : 'video';
        if (frag.duration === undefined || frag.duration <= 0) {
            return;
        }
        // Get fragment start and end times
        var fragStart = frag.start !== undefined ? frag.start : 0;
        var fragEnd = fragStart + frag.duration;
        // Create unique key for this fragment
        var fragmentKey = createFragmentKey(fragType, frag);
        // Calculate download progress (0-1)
        var downloadProgress = stats.total > 0 ? Math.min(stats.loaded / stats.total, 1) : 0;
        // Update segment download progress
        // If segment wasn't initialized yet, create it now
        var existing = this.currentDownloads[fragmentKey];
        if (existing) {
            existing.downloadProgress = downloadProgress;
            existing.lastUpdateTime = Date.now();
        }
        else {
            // Fallback: create if not initialized (shouldn't happen, but just in case)
            this.currentDownloads[fragmentKey] = {
                type: fragType,
                duration: frag.duration,
                start: fragStart,
                end: fragEnd,
                downloadProgress: downloadProgress,
                lastUpdateTime: Date.now(),
            };
        }
        // Clean up old entries (older than 10 seconds)
        var now = Date.now();
        Object.keys(this.currentDownloads).forEach(function (key) {
            var progress = _this.currentDownloads[key];
            if (now - progress.lastUpdateTime > 10000) {
                delete _this.currentDownloads[key];
            }
        });
    };
    /**
     * Clean up old download records that are far from the current position
     * This helps remove stale data after seek operations
     * @param currentPosition - Current playback position in seconds
     * @param bufferEnd - Current buffer end position in seconds
     */
    BufferingProgressTracker.prototype.cleanupOldDownloads = function (currentPosition, bufferEnd) {
        var _this = this;
        var maxRelevantDistance = 30.0; // Remove segments more than 30 seconds away
        var relevantStart = Math.min(currentPosition, bufferEnd) - maxRelevantDistance;
        var relevantEnd = Math.max(currentPosition, bufferEnd) + maxRelevantDistance;
        var toDelete = [];
        Object.keys(this.currentDownloads).forEach(function (key) {
            var progress = _this.currentDownloads[key];
            // Only remove segments that are:
            // 1. Far from current position/buffer (more than 30 seconds away)
            // 2. Fully downloaded AND already buffered (progress >= 1.0 AND end <= bufferEnd)
            // Don't remove segments that are still downloading (progress < 1.0) even if they're fully buffered
            // This prevents progress from jumping to 0 when a segment is still downloading
            var isFarAway = progress.end < relevantStart || progress.start > relevantEnd;
            var isFullyDownloadedAndBuffered = progress.downloadProgress >= 1.0 && progress.end <= bufferEnd + 1.0;
            if (isFarAway || isFullyDownloadedAndBuffered) {
                toDelete.push(key);
            }
        });
        toDelete.forEach(function (key) {
            delete _this.currentDownloads[key];
        });
    };
    /**
     * Get the incremental buffer duration currently being downloaded
     * Only counts segments that are immediately after the current buffer end
     * Returns the sum of video and audio incremental buffer
     * This allows progress to increase when either video or audio is downloading
     * @param currentPosition - Current playback position in seconds
     * @param videoBufferEnd - Current video buffer end position in seconds
     * @param audioBufferEnd - Current audio buffer end position in seconds
     */
    BufferingProgressTracker.prototype.getIncrementalBufferDuration = function (currentPosition, videoBufferEnd, audioBufferEnd) {
        var _this = this;
        var videoIncrement = 0;
        var audioIncrement = 0;
        // Use the minimum buffer end to determine what segments are needed
        // Both video and audio need to be buffered for playback
        var bufferEnd = Math.min(videoBufferEnd, audioBufferEnd);
        // If bufferEnd is invalid, return 0
        if (!isFinite(bufferEnd) || bufferEnd < 0) {
            return 0;
        }
        // Clean up old downloads that are far from current position
        // This ensures we only track relevant segments after seek operations
        this.cleanupOldDownloads(currentPosition, bufferEnd);
        // During buffering, we want to count segments that will extend the buffer
        // Count segments that start at or after the buffer end (within reasonable range)
        // This covers segments being downloaded to fill the buffer gap
        Object.keys(this.currentDownloads).forEach(function (key) {
            var progress = _this.currentDownloads[key];
            // Calculate how much of this segment extends beyond the current buffer
            var segmentBufferedEnd = progress.start + (progress.duration * progress.downloadProgress);
            // Count segments that:
            // 1. Start at or after the buffer end (within 10 seconds), OR
            // 2. Start before buffer end but extend beyond it
            var maxFutureSegment = 10.0; // Allow segments up to 10 seconds in the future
            if (progress.start >= bufferEnd - 1.0 && progress.start <= bufferEnd + maxFutureSegment) {
                // Segment starts near or after buffer end
                if (segmentBufferedEnd > bufferEnd) {
                    // Calculate incremental duration: the part that extends beyond buffer
                    var incrementalDuration = segmentBufferedEnd - bufferEnd;
                    if (progress.type === 'video') {
                        videoIncrement += incrementalDuration;
                    }
                    else {
                        audioIncrement += incrementalDuration;
                    }
                }
            }
            else if (progress.start < bufferEnd && segmentBufferedEnd > bufferEnd) {
                // Segment starts before buffer end but extends beyond it
                // This can happen when a segment spans across the buffer boundary
                var incrementalDuration = segmentBufferedEnd - bufferEnd;
                if (progress.type === 'video') {
                    videoIncrement += incrementalDuration;
                }
                else {
                    audioIncrement += incrementalDuration;
                }
            }
        });
        // Return the sum of video and audio increments
        // This allows progress to increase when either video or audio is downloading
        return (videoIncrement + audioIncrement) / 2;
    };
    /**
     * Clear all download progress (called when buffering ends or player resets)
     */
    BufferingProgressTracker.prototype.reset = function () {
        this.currentDownloads = {};
    };
    /**
     * Remove completed segments (called when segment is fully downloaded)
     */
    BufferingProgressTracker.prototype.removeSegment = function (context) {
        var fragContext = context;
        if (!fragContext || !fragContext.frag) {
            return;
        }
        var frag = fragContext.frag;
        var fragType = frag.type === 'audio' ? 'audio' : 'video';
        var fragmentKey = createFragmentKey(fragType, frag);
        delete this.currentDownloads[fragmentKey];
    };
    return BufferingProgressTracker;
}());
exports.bufferingProgressTracker = BufferingProgressTracker.getInstance();
// Factory function to create custom loader class that extends default loader
function createCustomLoaderClass(HlsCtor) {
    var DefaultLoader = HlsCtor.DefaultConfig.loader;
    return /** @class */ (function (_super) {
        tslib_1.__extends(CustomLoader, _super);
        function CustomLoader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.loadStartTime = 0;
            return _this;
        }
        CustomLoader.prototype.load = function (context, config, callbacks) {
            var _this = this;
            this.loadStartTime = Date.now();
            var fragContext = context;
            if (fragContext === null || fragContext === void 0 ? void 0 : fragContext.frag) {
                var statsCheckInterval_1 = 200; // Check every 200ms (same as useBufferingProgress polling)
                var statsCheckHandle_1 = null;
                // Call parent load method if polling is not enabled
                if (!exports.bufferingProgressTracker.isPollingEnabled()) {
                    return _super.prototype.load.call(this, context, config, callbacks);
                }
                // Initialize segment tracking for buffering progress calculation
                exports.bufferingProgressTracker.initializeSegmentTracking(fragContext.frag);
                // Check stats periodically for smoother progress updates
                var checkStats_1 = function () {
                    try {
                        var loaderInstance = _this;
                        // Access stats directly from loader instance
                        var stats = loaderInstance.stats;
                        if (stats && typeof stats.loaded === 'number' && typeof stats.total === 'number' && stats.total > 0) {
                            // Check if download is still in progress
                            // stats.loading.start indicates a load has started
                            // stats.loading.end indicates the load has finished
                            var isInProgress = stats.loading.start && !stats.loading.end;
                            if (isInProgress) {
                                exports.bufferingProgressTracker.updateSegmentProgress(context, stats);
                            }
                            else {
                                // Download finished, stop polling
                                if (statsCheckHandle_1) {
                                    clearInterval(statsCheckHandle_1);
                                    statsCheckHandle_1 = null;
                                }
                            }
                        }
                    }
                    catch (e) {
                        // Ignore errors
                    }
                };
                // Only start polling after super.load is called (when download actually starts)
                // Use a small delay to ensure stats are available
                setTimeout(function () {
                    // Only start polling if it's enabled
                    if (!exports.bufferingProgressTracker.isPollingEnabled()) {
                        return;
                    }
                    var loaderInstance = _this;
                    var stats = loaderInstance.stats;
                    if (stats && stats.loading.start && !stats.loading.end) {
                        statsCheckHandle_1 = setInterval(checkStats_1, statsCheckInterval_1);
                        checkStats_1(); // Check immediately
                    }
                }, 100);
                // Clean up interval when request completes
                var originalOnSuccess_1 = callbacks.onSuccess;
                var originalOnError_1 = callbacks.onError;
                var originalOnTimeout_1 = callbacks.onTimeout;
                var originalOnAbort_1 = callbacks.onAbort;
                callbacks.onSuccess = function (response, stats, ctx, networkDetails) {
                    if (statsCheckHandle_1) {
                        clearInterval(statsCheckHandle_1);
                        statsCheckHandle_1 = null;
                    }
                    // Do final update with final stats
                    if (stats && typeof stats.loaded === 'number' && typeof stats.total === 'number' && stats.total > 0) {
                        exports.bufferingProgressTracker.updateSegmentProgress(ctx, stats);
                    }
                    if (originalOnSuccess_1) {
                        originalOnSuccess_1(response, stats, ctx, networkDetails);
                    }
                };
                callbacks.onError = function (error, ctx, networkDetails, stats) {
                    if (statsCheckHandle_1) {
                        clearInterval(statsCheckHandle_1);
                        statsCheckHandle_1 = null;
                    }
                    if (originalOnError_1) {
                        originalOnError_1(error, ctx, networkDetails, stats);
                    }
                };
                callbacks.onTimeout = function (stats, ctx, networkDetails) {
                    if (statsCheckHandle_1) {
                        clearInterval(statsCheckHandle_1);
                        statsCheckHandle_1 = null;
                    }
                    if (originalOnTimeout_1) {
                        originalOnTimeout_1(stats, ctx, networkDetails);
                    }
                };
                callbacks.onAbort = function (stats, ctx, networkDetails) {
                    if (statsCheckHandle_1) {
                        clearInterval(statsCheckHandle_1);
                        statsCheckHandle_1 = null;
                    }
                    if (originalOnAbort_1) {
                        originalOnAbort_1(stats, ctx, networkDetails);
                    }
                };
            }
            // Call parent load method
            _super.prototype.load.call(this, context, config, callbacks);
        };
        return CustomLoader;
    }(DefaultLoader));
}
//# sourceMappingURL=customHlsLoader.js.map