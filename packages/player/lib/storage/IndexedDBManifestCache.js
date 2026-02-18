"use strict";
/**
 * IndexedDBManifestCache - Persistent manifest caching using IndexedDB
 *
 * This class provides manifest caching functionality that persists across sessions.
 * It integrates with hls.js playlist loading to cache and retrieve manifests from IndexedDB.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedDBManifestCache = void 0;
exports.getDefaultManifestCache = getDefaultManifestCache;
exports.resetDefaultManifestCache = resetDefaultManifestCache;
var tslib_1 = require("tslib");
var IndexedDBStorage_1 = require("./IndexedDBStorage");
var types_1 = require("./types");
/**
 * IndexedDBManifestCache provides persistent manifest caching
 */
var IndexedDBManifestCache = /** @class */ (function () {
    function IndexedDBManifestCache(storageConfig, cacheConfig) {
        this.isInitialized = false;
        this.initPromise = null;
        // Statistics
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.cacheWrites = 0;
        this.config = tslib_1.__assign({ debug: false, enabled: true, manifestTTL: 48 * 60 * 60 * 1000 }, cacheConfig);
        this.storage = new IndexedDBStorage_1.IndexedDBStorage(tslib_1.__assign({ dbName: 'TubiPlayerManifestCache', maxStorageSize: 50 * 1024 * 1024, defaultTTL: this.config.manifestTTL }, storageConfig));
        /* istanbul ignore next -- @preserve noop function when debug is false */
        // eslint-disable-next-line no-console
        this.log = this.config.debug ? function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return console.log.apply(console, tslib_1.__spreadArray(['[IndexedDBManifestCache]'], args, false));
        } : function () { };
    }
    /**
     * Check if IndexedDB is supported
     */
    IndexedDBManifestCache.isSupported = function () {
        return IndexedDBStorage_1.IndexedDBStorage.isSupported();
    };
    /**
     * Initialize the cache
     *
     * Note: This method is idempotent - calling it multiple times will only
     * initialize once.
     */
    IndexedDBManifestCache.prototype.init = function () {
        var _this = this;
        if (!this.config.enabled) {
            this.log('Cache is disabled');
            return Promise.resolve();
        }
        if (this.isInitialized) {
            return Promise.resolve();
        }
        if (this.initPromise) {
            return this.initPromise;
        }
        this.initPromise = (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var error_1;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.storage.init()];
                    case 1:
                        _a.sent();
                        this.isInitialized = true;
                        this.log('Manifest cache initialized');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        this.log('Failed to initialize manifest cache:', error_1);
                        // Don't throw - gracefully degrade to no caching
                        this.config.enabled = false;
                        this.isInitialized = false;
                        this.initPromise = null;
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); })();
        return this.initPromise;
    };
    /**
     * Check if cache is ready
     */
    IndexedDBManifestCache.prototype.isReady = function () {
        return this.config.enabled === true && this.isInitialized && this.storage.isReady();
    };
    /**
     * Generate a cache key for a manifest
     * Uses the last two path segments of the URL as the key
     * e.g., "https://example.com/content/123/master.m3u8?token=abc" -> "123/master.m3u8"
     */
    IndexedDBManifestCache.prototype.generateKey = function (url) {
        return this.getLastTwoPathSegments(url);
    };
    /**
     * Extract the last two path segments from a URL (excluding query string)
     * e.g., "https://example.com/content/123/master.m3u8?token=abc" -> "123/master.m3u8"
     * e.g., "https://example.com/content/123/720p/playlist.m3u8" -> "720p/playlist.m3u8"
     */
    IndexedDBManifestCache.prototype.getLastTwoPathSegments = function (url) {
        // Remove query string first
        var pathOnly = url.split('?')[0];
        // Split by slash and get last two segments
        var segments = pathOnly.split('/').filter(Boolean);
        if (segments.length >= 2) {
            return "".concat(segments[segments.length - 2], "/").concat(segments[segments.length - 1]);
        }
        /* istanbul ignore next -- @preserve fallback when no segments */
        return segments[segments.length - 1] || pathOnly;
    };
    /**
     * Extract the content identifier from a cache key
     * Keys are in format "{contentId}/{filename}", so we extract the first segment
     * e.g., "123/master.m3u8" -> "123"
     */
    IndexedDBManifestCache.prototype.getContentIdFromKey = function (key) {
        var slashIndex = key.indexOf('/');
        return slashIndex > 0 ? key.substring(0, slashIndex) : key;
    };
    /**
     * Delete all cached manifests for a specific content ID
     * This is used when URL mismatch is detected (token expired or CDN changed)
     *
     * Uses a single transaction with cursor-based deletion and timestamp filtering
     * to avoid race conditions where a fresh manifest could be deleted.
     *
     * @param contentId - The content ID to delete manifests for
     * @param olderThan - Only delete entries with timestamp older than this value.
     *                    Defaults to current time to prevent deleting fresh entries
     *                    that may be stored concurrently.
     */
    IndexedDBManifestCache.prototype.deleteContentManifests = function (contentId_1) {
        return tslib_1.__awaiter(this, arguments, void 0, function (contentId, olderThan) {
            var dbManager, transaction_1, store_1, deletedCount_1, error_2;
            var _this = this;
            if (olderThan === void 0) { olderThan = Date.now(); }
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.isReady()) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        dbManager = this.storage.getDBManager();
                        return [4 /*yield*/, dbManager.getTransaction(types_1.STORE_NAMES.MANIFESTS, 'readwrite')];
                    case 2:
                        transaction_1 = _a.sent();
                        store_1 = dbManager.getStore(transaction_1, types_1.STORE_NAMES.MANIFESTS);
                        deletedCount_1 = 0;
                        // Use cursor to find and delete entries in a single transaction
                        // Only delete entries older than the specified timestamp to avoid
                        // accidentally deleting fresh manifests stored during this operation
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var request = store_1.openCursor();
                                /* istanbul ignore next -- @preserve IndexedDB error callback is hard to trigger in tests */
                                request.onerror = function () {
                                    reject(request.error);
                                };
                                request.onsuccess = function () {
                                    var cursor = request.result;
                                    if (cursor) {
                                        var entry = cursor.value;
                                        if (_this.getContentIdFromKey(entry.key) === contentId && entry.timestamp < olderThan) {
                                            cursor.delete();
                                            deletedCount_1++;
                                        }
                                        cursor.continue();
                                    }
                                    else {
                                        resolve();
                                    }
                                };
                                /* istanbul ignore next -- @preserve IndexedDB transaction error is hard to trigger in tests */
                                transaction_1.onerror = function () {
                                    reject(transaction_1.error);
                                };
                            })];
                    case 3:
                        // Use cursor to find and delete entries in a single transaction
                        // Only delete entries older than the specified timestamp to avoid
                        // accidentally deleting fresh manifests stored during this operation
                        _a.sent();
                        if (deletedCount_1 > 0) {
                            this.log("Deleted ".concat(deletedCount_1, " manifests for content ").concat(contentId, " (older than ").concat(olderThan, ")"));
                        }
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        this.log('Failed to delete content manifests:', error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Store a manifest in the cache after it's been loaded/parsed
     *
     * @param url - The manifest URL
     * @param data - The manifest content
     * @param type - The manifest type
     */
    IndexedDBManifestCache.prototype.storeManifest = function (url, data, type) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var key, storageType, entry, success, error_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.enabled) {
                            return [2 /*return*/, false];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.init()];
                    case 2:
                        _a.sent();
                        if (!this.isReady()) {
                            return [2 /*return*/, false];
                        }
                        key = this.generateKey(url);
                        storageType = type === 'manifest' ? 'master' : type;
                        entry = {
                            key: key,
                            type: types_1.StorageEntryType.MANIFEST,
                            timestamp: Date.now(),
                            size: data.length * 2, // Estimate IndexedDB storage size (JS strings are UTF-16 internally)
                            data: data,
                            url: url,
                            manifestType: storageType,
                            ttl: this.config.manifestTTL,
                        };
                        return [4 /*yield*/, this.storage.put(types_1.STORE_NAMES.MANIFESTS, entry)];
                    case 3:
                        success = _a.sent();
                        if (success) {
                            this.cacheWrites++;
                            this.log("Stored manifest: ".concat(type, " key=").concat(key));
                        }
                        return [2 /*return*/, success];
                    case 4:
                        error_3 = _a.sent();
                        this.log('Failed to store manifest:', error_3);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Store a manifest from hls.js playlist loaded event
     *
     * @param context - The hls.js playlist loader context
     * @param responseText - The manifest content
     */
    IndexedDBManifestCache.prototype.storeFromPlaylistLoaded = function (context, responseText) {
        var type = context.type;
        if (!['manifest', 'level', 'audioTrack'].includes(type)) {
            return Promise.resolve(false);
        }
        return this.storeManifest(context.url, responseText, type);
    };
    /**
     * Get a manifest from the cache
     *
     * @param url - The manifest URL
     */
    IndexedDBManifestCache.prototype.getManifest = function (url) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var key, result, contentId, cacheAge, error_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.enabled) {
                            return [2 /*return*/, { found: false, data: null, expired: false }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, this.init()];
                    case 2:
                        _a.sent();
                        if (!this.isReady()) {
                            this.cacheMisses++;
                            return [2 /*return*/, { found: false, data: null, expired: false }];
                        }
                        key = this.generateKey(url);
                        return [4 /*yield*/, this.storage.get(types_1.STORE_NAMES.MANIFESTS, key)];
                    case 3:
                        result = _a.sent();
                        if (result.found && result.data) {
                            // Check if the full URL matches (token/CDN validation)
                            if (result.data.url !== url) {
                                this.log("URL mismatch: cached=".concat(result.data.url, ", requested=").concat(url));
                                contentId = this.getContentIdFromKey(key);
                                /* istanbul ignore next -- @preserve fire-and-forget error handler */
                                this.deleteContentManifests(contentId).catch(function () { });
                                this.cacheMisses++;
                                return [2 /*return*/, { found: false, data: null, expired: false, urlMismatch: true }];
                            }
                            this.cacheHits++;
                            cacheAge = Date.now() - result.data.timestamp;
                            this.log("Cache hit: key=".concat(key, " age=").concat(cacheAge, "ms"));
                            return [2 /*return*/, { found: true, data: result.data.data, expired: false, cacheAge: cacheAge }];
                        }
                        this.cacheMisses++;
                        this.log("Cache miss: key=".concat(key));
                        return [2 /*return*/, { found: false, data: null, expired: false }];
                    case 4:
                        error_4 = _a.sent();
                        this.log('Failed to get manifest from cache:', error_4);
                        this.cacheMisses++;
                        return [2 /*return*/, { found: false, data: null, expired: false }];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get a manifest from the cache using hls.js context
     *
     * @param context - The hls.js playlist loader context
     */
    IndexedDBManifestCache.prototype.getFromContext = function (context) {
        var type = context.type;
        if (!['manifest', 'level', 'audioTrack'].includes(type)) {
            return Promise.resolve({ found: false, data: null, expired: false });
        }
        return this.getManifest(context.url);
    };
    /**
     * Check if a manifest exists in the cache
     *
     * @param url - The manifest URL
     */
    IndexedDBManifestCache.prototype.hasManifest = function (url) {
        if (!this.config.enabled || !this.isReady()) {
            return Promise.resolve(false);
        }
        var key = this.generateKey(url);
        return this.storage.has(types_1.STORE_NAMES.MANIFESTS, key);
    };
    /**
     * Get cache statistics
     */
    IndexedDBManifestCache.prototype.getStats = function () {
        var total = this.cacheHits + this.cacheMisses;
        return {
            hits: this.cacheHits,
            misses: this.cacheMisses,
            writes: this.cacheWrites,
            hitRate: total > 0 ? this.cacheHits / total : 0,
        };
    };
    /**
     * Reset statistics
     */
    IndexedDBManifestCache.prototype.resetStats = function () {
        this.cacheHits = 0;
        this.cacheMisses = 0;
        this.cacheWrites = 0;
    };
    /**
     * Clear all cached manifests
     */
    IndexedDBManifestCache.prototype.clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error_5;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.config.enabled || !this.isReady()) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.storage.clear()];
                    case 2:
                        _a.sent();
                        this.log('Cleared all cached manifests');
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        this.log('Failed to clear manifests:', error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Close the cache
     */
    IndexedDBManifestCache.prototype.close = function () {
        this.storage.close();
        this.isInitialized = false;
        this.initPromise = null;
        this.log('Manifest cache closed');
    };
    /**
     * Get the underlying storage instance
     */
    IndexedDBManifestCache.prototype.getStorage = function () {
        return this.storage;
    };
    return IndexedDBManifestCache;
}());
exports.IndexedDBManifestCache = IndexedDBManifestCache;
// Singleton instance for convenient global access
var defaultInstance;
/**
 * Get or create the default IndexedDBManifestCache instance
 */
function getDefaultManifestCache(storageConfig, cacheConfig) {
    if (!defaultInstance) {
        defaultInstance = new IndexedDBManifestCache(storageConfig, cacheConfig);
    }
    return defaultInstance;
}
/**
 * Reset the default instance
 */
function resetDefaultManifestCache() {
    if (defaultInstance) {
        defaultInstance.close();
        defaultInstance = undefined;
    }
}
//# sourceMappingURL=IndexedDBManifestCache.js.map