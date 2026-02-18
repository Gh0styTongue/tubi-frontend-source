"use strict";
/**
 * StorageQuotaManager - Manages storage quota and cleanup for IndexedDB
 *
 * Features:
 * - Track storage usage
 * - Automatic cleanup when quota is exceeded
 * - LRU-based eviction strategy
 * - Storage estimation using Navigator API
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageQuotaManager = exports.CleanupStrategy = void 0;
var tslib_1 = require("tslib");
var types_1 = require("./types");
/**
 * Extract the content identifier from a manifest cache key
 * Keys are in format "{segment1}/{segment2}", where segment1 identifies the content
 * e.g., "123/master.m3u8" -> "123"
 */
function getContentIdFromKey(key) {
    var slashIndex = key.indexOf('/');
    if (slashIndex > 0) {
        return key.substring(0, slashIndex);
    }
    return key;
}
/**
 * Cleanup strategy options
 */
var CleanupStrategy;
(function (CleanupStrategy) {
    /** Least Recently Used - remove oldest entries first */
    CleanupStrategy["LRU"] = "lru";
    /** Least Recently Created - remove entries with earliest timestamp */
    CleanupStrategy["LRC"] = "lrc";
    /** Size-based - remove largest entries first */
    CleanupStrategy["SIZE"] = "size";
})(CleanupStrategy || (exports.CleanupStrategy = CleanupStrategy = {}));
/**
 * StorageQuotaManager handles storage quota tracking and cleanup operations
 */
var StorageQuotaManager = /** @class */ (function () {
    function StorageQuotaManager(dbManager, config) {
        this.cachedStats = null;
        this.statsTimestamp = 0;
        this.STATS_CACHE_TTL = 5000; // 5 seconds
        this.dbManager = dbManager;
        this.config = config;
        /* istanbul ignore next -- @preserve debug log function */
        // eslint-disable-next-line no-console
        this.log = config.debug ? function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return console.log.apply(console, tslib_1.__spreadArray(['[StorageQuotaManager]'], args, false));
        } : function () { };
    }
    /**
     * Get storage quota information from the browser
     */
    StorageQuotaManager.prototype.getQuotaInfo = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var estimate, quota, usage, error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(typeof navigator !== 'undefined' && 'storage' in navigator && navigator.storage.estimate)) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, navigator.storage.estimate()];
                    case 2:
                        estimate = _a.sent();
                        quota = estimate.quota || 0;
                        usage = estimate.usage || 0;
                        return [2 /*return*/, {
                                quota: quota,
                                usage: usage,
                                usagePercentage: quota > 0 ? (usage / quota) * 100 : 0,
                                isSupported: true,
                            }];
                    case 3:
                        error_1 = _a.sent();
                        this.log('Failed to get storage estimate:', error_1);
                        return [3 /*break*/, 4];
                    case 4: 
                    // Fallback: return estimated values based on configuration
                    return [2 /*return*/, {
                            quota: this.config.maxStorageSize * 10, // Assume 10x our limit as browser quota
                            usage: 0,
                            usagePercentage: 0,
                            isSupported: false,
                        }];
                }
            });
        });
    };
    /**
     * Get storage statistics for our database
     */
    StorageQuotaManager.prototype.getStats = function () {
        return tslib_1.__awaiter(this, arguments, void 0, function (forceRefresh) {
            var now, stats, segmentStats, manifestStats, error_2;
            if (forceRefresh === void 0) { forceRefresh = false; }
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        if (!forceRefresh &&
                            this.cachedStats &&
                            now - this.statsTimestamp < this.STATS_CACHE_TTL) {
                            return [2 /*return*/, this.cachedStats];
                        }
                        stats = {
                            totalSize: 0,
                            segmentCount: 0,
                            manifestCount: 0,
                            oldestEntry: null,
                            newestEntry: null,
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.getStoreStats(types_1.STORE_NAMES.SEGMENTS)];
                    case 2:
                        segmentStats = _a.sent();
                        stats.segmentCount = segmentStats.count;
                        stats.totalSize += segmentStats.totalSize;
                        if (segmentStats.oldestTimestamp !== null) {
                            /* istanbul ignore next -- @preserve ternary branch for timestamp comparison */
                            stats.oldestEntry =
                                stats.oldestEntry === null
                                    ? segmentStats.oldestTimestamp
                                    : Math.min(stats.oldestEntry, segmentStats.oldestTimestamp);
                        }
                        if (segmentStats.newestTimestamp !== null) {
                            /* istanbul ignore next -- @preserve ternary branch for timestamp comparison */
                            stats.newestEntry =
                                stats.newestEntry === null
                                    ? segmentStats.newestTimestamp
                                    : Math.max(stats.newestEntry, segmentStats.newestTimestamp);
                        }
                        return [4 /*yield*/, this.getStoreStats(types_1.STORE_NAMES.MANIFESTS)];
                    case 3:
                        manifestStats = _a.sent();
                        stats.manifestCount = manifestStats.count;
                        stats.totalSize += manifestStats.totalSize;
                        if (manifestStats.oldestTimestamp !== null) {
                            stats.oldestEntry =
                                stats.oldestEntry === null
                                    ? manifestStats.oldestTimestamp
                                    : Math.min(stats.oldestEntry, manifestStats.oldestTimestamp);
                        }
                        if (manifestStats.newestTimestamp !== null) {
                            stats.newestEntry =
                                stats.newestEntry === null
                                    ? manifestStats.newestTimestamp
                                    : Math.max(stats.newestEntry, manifestStats.newestTimestamp);
                        }
                        // Cache the stats
                        this.cachedStats = stats;
                        this.statsTimestamp = now;
                        this.log('Storage stats:', stats);
                        return [2 /*return*/, stats];
                    case 4:
                        error_2 = _a.sent();
                        this.log('Failed to get storage stats:', error_2);
                        throw error_2;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get statistics for a specific store
     */
    StorageQuotaManager.prototype.getStoreStats = function (storeName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var result, transaction, store_1, error_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = {
                            count: 0,
                            totalSize: 0,
                            oldestTimestamp: null,
                            newestTimestamp: null,
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.dbManager.getTransaction(storeName, 'readonly')];
                    case 2:
                        transaction = _a.sent();
                        store_1 = this.dbManager.getStore(transaction, storeName);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var request = store_1.openCursor();
                                /* istanbul ignore next -- @preserve IndexedDB cursor error handler */
                                request.onerror = function () {
                                    var _a;
                                    reject(new types_1.IndexedDBError("Failed to get store stats: ".concat((_a = request.error) === null || _a === void 0 ? void 0 : _a.message), types_1.IndexedDBErrorType.TRANSACTION_ERROR, request.error || undefined));
                                };
                                request.onsuccess = function () {
                                    var cursor = request.result;
                                    if (cursor) {
                                        var entry = cursor.value;
                                        result.count++;
                                        /* istanbul ignore next -- @preserve fallback for entries without size */
                                        result.totalSize += entry.size || 0;
                                        if (entry.timestamp) {
                                            if (result.oldestTimestamp === null) {
                                                result.oldestTimestamp = entry.timestamp;
                                                result.newestTimestamp = entry.timestamp;
                                            }
                                            else {
                                                result.oldestTimestamp = Math.min(result.oldestTimestamp, entry.timestamp);
                                                result.newestTimestamp = Math.max(result.newestTimestamp, entry.timestamp);
                                            }
                                        }
                                        cursor.continue();
                                    }
                                    else {
                                        resolve(result);
                                    }
                                };
                            })];
                    case 3:
                        error_3 = _a.sent();
                        this.log('Failed to get store stats for', storeName, ':', error_3);
                        return [2 /*return*/, result];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if storage is near the configured limit
     */
    StorageQuotaManager.prototype.isNearLimit = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var stats, threshold;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getStats()];
                    case 1:
                        stats = _a.sent();
                        threshold = this.config.maxStorageSize * this.config.cleanupThreshold;
                        return [2 /*return*/, stats.totalSize >= threshold];
                }
            });
        });
    };
    /**
     * Check if we have enough space for new data
     */
    StorageQuotaManager.prototype.hasSpaceFor = function (bytes) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var stats;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getStats()];
                    case 1:
                        stats = _a.sent();
                        return [2 /*return*/, stats.totalSize + bytes <= this.config.maxStorageSize];
                }
            });
        });
    };
    /**
     * Perform cleanup to free storage space
     */
    /* istanbul ignore next -- @preserve default parameter */
    StorageQuotaManager.prototype.cleanup = function () {
        return tslib_1.__awaiter(this, arguments, void 0, function (strategy, targetBytes) {
            var startTime, result, stats, targetSize, bytesToFree, strategyResult, error_4;
            if (strategy === void 0) { strategy = CleanupStrategy.LRU; }
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        result = {
                            entriesRemoved: 0,
                            bytesFreed: 0,
                            timeTaken: 0,
                        };
                        this.log('Starting cleanup with strategy:', strategy);
                        return [4 /*yield*/, this.getStats(true)];
                    case 1:
                        stats = _a.sent();
                        targetSize = targetBytes !== null && targetBytes !== void 0 ? targetBytes : this.config.maxStorageSize * this.config.cleanupTarget;
                        bytesToFree = stats.totalSize - targetSize;
                        if (bytesToFree <= 0) {
                            this.log('No cleanup needed, current size:', stats.totalSize);
                            result.timeTaken = Date.now() - startTime;
                            return [2 /*return*/, result];
                        }
                        this.log('Need to free', bytesToFree, 'bytes');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.cleanupByStrategy(strategy, bytesToFree)];
                    case 3:
                        strategyResult = _a.sent();
                        result.entriesRemoved += strategyResult.entriesRemoved;
                        result.bytesFreed += strategyResult.bytesFreed;
                        // Invalidate cached stats
                        this.cachedStats = null;
                        result.timeTaken = Date.now() - startTime;
                        this.log('Cleanup completed:', result);
                        return [2 /*return*/, result];
                    case 4:
                        error_4 = _a.sent();
                        this.log('Cleanup failed:', error_4);
                        result.timeTaken = Date.now() - startTime;
                        throw error_4;
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clean up entries using the specified strategy
     */
    StorageQuotaManager.prototype.cleanupByStrategy = function (strategy, bytesToFree) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var result, segmentEntries, manifestEntries, stores, _loop_1, this_1, _i, stores_1, storeName, sortFn, manifestsByContent, _a, manifestEntries_1, entry, contentId, existing, contentGroups, segmentKeysToDelete, manifestKeysToDelete, segmentIdx, contentGroupIdx, hasSegments, hasManifests, deleteSegment, segment, contentGroup, segment, contentGroup, _b, _c, entry;
            return tslib_1.__generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        result = {
                            entriesRemoved: 0,
                            bytesFreed: 0,
                            timeTaken: 0,
                        };
                        segmentEntries = [];
                        manifestEntries = [];
                        stores = [types_1.STORE_NAMES.SEGMENTS, types_1.STORE_NAMES.MANIFESTS];
                        _loop_1 = function (storeName) {
                            var transaction, store_2, error_5;
                            return tslib_1.__generator(this, function (_e) {
                                switch (_e.label) {
                                    case 0:
                                        _e.trys.push([0, 3, , 4]);
                                        return [4 /*yield*/, this_1.dbManager.getTransaction(storeName, 'readonly')];
                                    case 1:
                                        transaction = _e.sent();
                                        store_2 = this_1.dbManager.getStore(transaction, storeName);
                                        // eslint-disable-next-line no-await-in-loop
                                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                                var request = store_2.openCursor();
                                                /* istanbul ignore next -- @preserve IndexedDB cursor error handler */
                                                request.onerror = function () {
                                                    reject(request.error);
                                                };
                                                request.onsuccess = function () {
                                                    var cursor = request.result;
                                                    /* istanbul ignore next -- @preserve cursor handling */
                                                    if (cursor) {
                                                        var entry = cursor.value;
                                                        var entryData = {
                                                            key: entry.key,
                                                            timestamp: entry.timestamp,
                                                            size: entry.size || 0,
                                                        };
                                                        if (storeName === types_1.STORE_NAMES.SEGMENTS) {
                                                            segmentEntries.push(entryData);
                                                        }
                                                        else {
                                                            manifestEntries.push(entryData);
                                                        }
                                                        cursor.continue();
                                                    }
                                                    else {
                                                        resolve();
                                                    }
                                                };
                                            })];
                                    case 2:
                                        // eslint-disable-next-line no-await-in-loop
                                        _e.sent();
                                        return [3 /*break*/, 4];
                                    case 3:
                                        error_5 = _e.sent();
                                        this_1.log('Failed to read entries from', storeName, ':', error_5);
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, stores_1 = stores;
                        _d.label = 1;
                    case 1:
                        if (!(_i < stores_1.length)) return [3 /*break*/, 4];
                        storeName = stores_1[_i];
                        return [5 /*yield**/, _loop_1(storeName)];
                    case 2:
                        _d.sent();
                        _d.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        sortFn = function (a, b) {
                            /* istanbul ignore next -- @preserve sort function branch coverage */
                            switch (strategy) {
                                case CleanupStrategy.SIZE:
                                    return b.size - a.size;
                                case CleanupStrategy.LRU:
                                case CleanupStrategy.LRC:
                                default:
                                    return a.timestamp - b.timestamp;
                            }
                        };
                        segmentEntries.sort(sortFn);
                        manifestEntries.sort(sortFn);
                        manifestsByContent = new Map();
                        for (_a = 0, manifestEntries_1 = manifestEntries; _a < manifestEntries_1.length; _a++) {
                            entry = manifestEntries_1[_a];
                            contentId = getContentIdFromKey(entry.key);
                            existing = manifestsByContent.get(contentId) || [];
                            existing.push(entry);
                            manifestsByContent.set(contentId, existing);
                        }
                        contentGroups = [];
                        /* istanbul ignore next -- @preserve manifest grouping callbacks */
                        manifestsByContent.forEach(function (entries, contentId) {
                            var oldestTimestamp = Math.min.apply(Math, entries.map(function (e) { return e.timestamp; }));
                            var totalSize = entries.reduce(function (sum, e) { return sum + e.size; }, 0);
                            contentGroups.push({ contentId: contentId, entries: entries, oldestTimestamp: oldestTimestamp, totalSize: totalSize });
                        });
                        // Sort content groups by oldest timestamp (LRU) or total size (SIZE strategy)
                        /* istanbul ignore next -- @preserve content group sort callbacks */
                        if (strategy === CleanupStrategy.SIZE) {
                            contentGroups.sort(function (a, b) { return b.totalSize - a.totalSize; });
                        }
                        else {
                            contentGroups.sort(function (a, b) { return a.oldestTimestamp - b.oldestTimestamp; });
                        }
                        segmentKeysToDelete = [];
                        manifestKeysToDelete = [];
                        segmentIdx = 0;
                        contentGroupIdx = 0;
                        while (result.bytesFreed < bytesToFree) {
                            hasSegments = segmentIdx < segmentEntries.length;
                            hasManifests = contentGroupIdx < contentGroups.length;
                            if (!hasSegments && !hasManifests) {
                                break;
                            }
                            deleteSegment = false;
                            if (hasSegments && hasManifests) {
                                segment = segmentEntries[segmentIdx];
                                contentGroup = contentGroups[contentGroupIdx];
                                if (strategy === CleanupStrategy.SIZE) {
                                    deleteSegment = segment.size >= contentGroup.totalSize;
                                }
                                else {
                                    // LRU/LRC: compare timestamps
                                    deleteSegment = segment.timestamp <= contentGroup.oldestTimestamp;
                                }
                            }
                            else if (hasSegments) {
                                deleteSegment = true;
                            }
                            if (deleteSegment) {
                                segment = segmentEntries[segmentIdx];
                                segmentKeysToDelete.push(segment.key);
                                result.entriesRemoved++;
                                result.bytesFreed += segment.size;
                                segmentIdx++;
                            }
                            else {
                                contentGroup = contentGroups[contentGroupIdx];
                                for (_b = 0, _c = contentGroup.entries; _b < _c.length; _b++) {
                                    entry = _c[_b];
                                    manifestKeysToDelete.push(entry.key);
                                    result.entriesRemoved++;
                                    result.bytesFreed += entry.size;
                                }
                                this.log("Deleting all manifests for content ".concat(contentGroup.contentId, ":"), contentGroup.entries.length, 'entries,', contentGroup.totalSize, 'bytes');
                                contentGroupIdx++;
                            }
                        }
                        if (!(segmentKeysToDelete.length > 0)) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.dbManager.executeBatchWrite(types_1.STORE_NAMES.SEGMENTS, 
                            /* istanbul ignore next -- @preserve map callback */
                            segmentKeysToDelete.map(function (key) { return ({ type: 'delete', key: key }); }))];
                    case 5:
                        _d.sent();
                        _d.label = 6;
                    case 6:
                        if (!(manifestKeysToDelete.length > 0)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.dbManager.executeBatchWrite(types_1.STORE_NAMES.MANIFESTS, 
                            /* istanbul ignore next -- @preserve map callback */
                            manifestKeysToDelete.map(function (key) { return ({ type: 'delete', key: key }); }))];
                    case 7:
                        _d.sent();
                        _d.label = 8;
                    case 8: return [2 /*return*/, result];
                }
            });
        });
    };
    /**
     * Ensure there's enough space for new data, performing cleanup if necessary
     */
    StorageQuotaManager.prototype.ensureSpace = function (requiredBytes) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var hasSpace, stats, targetSize, bytesToFree, error_6;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.hasSpaceFor(requiredBytes)];
                    case 1:
                        hasSpace = _a.sent();
                        if (hasSpace) {
                            return [2 /*return*/, true];
                        }
                        this.log('Not enough space for', requiredBytes, 'bytes, initiating cleanup');
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, this.getStats(true)];
                    case 3:
                        stats = _a.sent();
                        targetSize = this.config.maxStorageSize * this.config.cleanupTarget - requiredBytes;
                        bytesToFree = stats.totalSize - targetSize;
                        return [4 /*yield*/, this.cleanup(CleanupStrategy.LRU, bytesToFree)];
                    case 4:
                        _a.sent();
                        // Check again after cleanup
                        return [2 /*return*/, this.hasSpaceFor(requiredBytes)];
                    case 5:
                        error_6 = _a.sent();
                        this.log('Failed to ensure space:', error_6);
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return StorageQuotaManager;
}());
exports.StorageQuotaManager = StorageQuotaManager;
//# sourceMappingURL=StorageQuotaManager.js.map