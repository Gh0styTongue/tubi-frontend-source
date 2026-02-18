"use strict";
/**
 * createCachedPlaylistLoader - Factory function to create a playlist loader with IndexedDB caching
 *
 * This creates a custom hls.js loader class that:
 * 1. Checks IndexedDB cache before making network requests
 * 2. Stores successfully loaded playlists to IndexedDB after parsing
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCachedPlaylistLoader = createCachedPlaylistLoader;
exports.createCachedPlaylistLoaderWithCache = createCachedPlaylistLoaderWithCache;
var tslib_1 = require("tslib");
var IndexedDBManifestCache_1 = require("./IndexedDBManifestCache");
/**
 * Check if a loader context is a playlist context
 */
function isPlaylistContext(context) {
    var type = context.type;
    return type === 'manifest' || type === 'level' || type === 'audioTrack';
}
/**
 * Create stats object for cached response
 */
function createCacheStats() {
    var now = performance.now();
    return {
        aborted: false,
        loaded: 0,
        retry: 0,
        total: 0,
        chunkCount: 0,
        bwEstimate: 0,
        loading: { start: now, first: now, end: now },
        parsing: { start: now, end: now },
        buffering: { start: now, first: now, end: now },
    };
}
/**
 * Get manifest type from playlist context
 */
function getManifestTypeFromContext(context) {
    return context.type;
}
/**
 * Factory function to create a cached playlist loader class
 */
function createCachedPlaylistLoader(HlsCtor, options) {
    if (options === void 0) { options = {}; }
    var DefaultLoader = HlsCtor.DefaultConfig.loader;
    // Use provided manifest cache or get the singleton instance
    var manifestCache = options.manifestCache || (0, IndexedDBManifestCache_1.getDefaultManifestCache)(undefined, tslib_1.__assign({ debug: options.debug }, options.cacheConfig));
    // Initialize cache asynchronously
    manifestCache.init().catch(function () {
        // Initialization errors are handled internally
    });
    // eslint-disable-next-line no-console
    var log = options.debug ? function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return console.log.apply(console, tslib_1.__spreadArray(['[CachedPlaylistLoader]'], args, false));
    } : function () { };
    // Event callbacks
    var eventCallbacks = options.eventCallbacks;
    return /** @class */ (function (_super) {
        tslib_1.__extends(CachedPlaylistLoader, _super);
        function CachedPlaylistLoader() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.usedCache = false;
            return _this;
        }
        CachedPlaylistLoader.prototype.load = function (context, config, callbacks) {
            // Only cache playlist requests
            if (!isPlaylistContext(context)) {
                _super.prototype.load.call(this, context, config, callbacks);
                return;
            }
            var playlistContext = context;
            // Try to load from cache first
            this.loadFromCacheOrNetwork(playlistContext, config, callbacks);
        };
        CachedPlaylistLoader.prototype.loadFromCacheOrNetwork = function (context, config, callbacks) {
            return tslib_1.__awaiter(this, void 0, void 0, function () {
                var startTime, manifestType, _a, cacheResult, loadTimeMs, response, stats, reason, error_1;
                var _b, _c, _d, _e;
                return tslib_1.__generator(this, function (_f) {
                    switch (_f.label) {
                        case 0:
                            startTime = performance.now();
                            manifestType = getManifestTypeFromContext(context);
                            _f.label = 1;
                        case 1:
                            _f.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, manifestCache.init()];
                        case 2:
                            _f.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _f.sent();
                            return [3 /*break*/, 4];
                        case 4:
                            if (!manifestCache.isReady()) return [3 /*break*/, 9];
                            _f.label = 5;
                        case 5:
                            _f.trys.push([5, 7, , 8]);
                            return [4 /*yield*/, manifestCache.getFromContext(context)];
                        case 6:
                            cacheResult = _f.sent();
                            loadTimeMs = performance.now() - startTime;
                            if (cacheResult.found && cacheResult.data) {
                                // Cache hit! Return cached data
                                log("Cache hit: ".concat(context.type, " ").concat(context.url));
                                this.usedCache = true;
                                // Emit cache hit event
                                /* istanbul ignore next -- @preserve event callback and cacheAge fallback */
                                (_b = eventCallbacks === null || eventCallbacks === void 0 ? void 0 : eventCallbacks.onCacheHit) === null || _b === void 0 ? void 0 : _b.call(eventCallbacks, {
                                    url: context.url,
                                    manifestType: manifestType,
                                    cacheAgeMs: cacheResult.cacheAge || 0,
                                    loadTimeMs: loadTimeMs,
                                });
                                response = {
                                    url: context.url,
                                    data: cacheResult.data,
                                };
                                stats = createCacheStats();
                                stats.loaded = cacheResult.data.length;
                                stats.total = cacheResult.data.length;
                                // Call success callback with cached data
                                callbacks.onSuccess(response, stats, context, null);
                                return [2 /*return*/];
                            }
                            reason = 'not_found';
                            /* istanbul ignore next -- @preserve expired is never true in current implementation */
                            if (cacheResult.expired) {
                                reason = 'expired';
                            }
                            else if (cacheResult.urlMismatch) {
                                reason = 'url_mismatch';
                            }
                            (_c = eventCallbacks === null || eventCallbacks === void 0 ? void 0 : eventCallbacks.onCacheMiss) === null || _c === void 0 ? void 0 : _c.call(eventCallbacks, {
                                url: context.url,
                                manifestType: manifestType,
                                reason: reason,
                            });
                            return [3 /*break*/, 8];
                        case 7:
                            error_1 = _f.sent();
                            log('Cache lookup failed, falling back to network:', error_1);
                            // Emit cache error event
                            /* istanbul ignore next -- @preserve error event emission */
                            (_d = eventCallbacks === null || eventCallbacks === void 0 ? void 0 : eventCallbacks.onCacheError) === null || _d === void 0 ? void 0 : _d.call(eventCallbacks, {
                                url: context.url,
                                manifestType: manifestType,
                                error: error_1 instanceof Error ? error_1.message : String(error_1),
                                operation: 'get',
                            });
                            return [3 /*break*/, 8];
                        case 8: return [3 /*break*/, 10];
                        case 9:
                            // Cache not ready, emit miss with disabled reason
                            (_e = eventCallbacks === null || eventCallbacks === void 0 ? void 0 : eventCallbacks.onCacheMiss) === null || _e === void 0 ? void 0 : _e.call(eventCallbacks, {
                                url: context.url,
                                manifestType: manifestType,
                                reason: 'disabled',
                            });
                            _f.label = 10;
                        case 10:
                            // Cache miss or error, fall back to network request
                            this.loadFromNetwork(context, config, callbacks);
                            return [2 /*return*/];
                    }
                });
            });
        };
        CachedPlaylistLoader.prototype.loadFromNetwork = function (context, config, callbacks) {
            // Wrap the success callback to store the response in cache
            var originalOnSuccess = callbacks.onSuccess;
            callbacks.onSuccess = function (response, stats, ctx, networkDetails) {
                // Store in cache after successful load
                if (isPlaylistContext(ctx) && typeof response.data === 'string') {
                    var playlistCtx = ctx;
                    // Store asynchronously, don't block the callback
                    manifestCache.storeFromPlaylistLoaded(playlistCtx, response.data).catch(function (error) {
                        log('Failed to store manifest in cache:', error);
                    });
                }
                // Call the original callback
                if (originalOnSuccess) {
                    originalOnSuccess(response, stats, ctx, networkDetails);
                }
            };
            // Call parent load method
            _super.prototype.load.call(this, context, config, callbacks);
        };
        /**
         * Get the manifest cache instance
         */
        CachedPlaylistLoader.getManifestCache = function () {
            return manifestCache;
        };
        /**
         * Check if this request used cached data
         */
        CachedPlaylistLoader.prototype.didUseCache = function () {
            return this.usedCache;
        };
        return CachedPlaylistLoader;
    }(DefaultLoader));
}
/**
 * Create a playlist loader with IndexedDB caching and return both the loader class and cache instance
 */
function createCachedPlaylistLoaderWithCache(HlsCtor, options) {
    if (options === void 0) { options = {}; }
    var manifestCache = options.manifestCache || new IndexedDBManifestCache_1.IndexedDBManifestCache(undefined, tslib_1.__assign({ debug: options.debug }, options.cacheConfig));
    var loader = createCachedPlaylistLoader(HlsCtor, tslib_1.__assign(tslib_1.__assign({}, options), { manifestCache: manifestCache }));
    return { loader: loader, manifestCache: manifestCache };
}
//# sourceMappingURL=createCachedPlaylistLoader.js.map