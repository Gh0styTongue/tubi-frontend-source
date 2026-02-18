"use strict";
/**
 * IndexedDB Storage Module for Player Package
 *
 * Provides persistent storage using IndexedDB with a clean separation of concerns:
 * - IndexedDBStorage: Generic key-value storage
 * - IndexedDBManifestCache: Manifest-specific caching with hls.js integration
 *
 * Features:
 * - IndexedDB lifecycle management (open, close, delete)
 * - Storage quota management with automatic cleanup
 * - Error handling and fault tolerance
 * - Simple version control
 *
 * @example
 * ```typescript
 * import { IndexedDBManifestCache } from '@adrise/player/storage';
 *
 * const cache = new IndexedDBManifestCache(undefined, {
 *   debug: true,
 *   contentId: 'video-123',
 * });
 *
 * await cache.init();
 *
 * // Store a manifest (masterUrl is used for grouping related manifests)
 * const masterUrl = 'https://example.com/master.m3u8';
 * await cache.storeManifest(url, manifestText, 'manifest', masterUrl);
 *
 * // Retrieve a manifest (masterUrl is required for key generation)
 * const result = await cache.getManifest(url, 'manifest', masterUrl);
 * if (result.found && !result.expired) {
 *   // Use result.data
 * }
 *
 * // Clean up when done
 * cache.close();
 * ```
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_STORAGE_CONFIG = exports.STORE_NAMES = exports.IndexedDBError = exports.IndexedDBErrorType = exports.StorageEntryType = exports.clearCachedManifests = exports.prefetchManifest = exports.createCachedPlaylistLoaderWithCache = exports.createCachedPlaylistLoader = exports.resetDefaultManifestCache = exports.getDefaultManifestCache = exports.IndexedDBManifestCache = exports.resetDefaultStorage = exports.getDefaultStorage = exports.IndexedDBStorage = exports.CleanupStrategy = exports.StorageQuotaManager = exports.IndexedDBManager = void 0;
// Core manager
var IndexedDBManager_1 = require("./IndexedDBManager");
Object.defineProperty(exports, "IndexedDBManager", { enumerable: true, get: function () { return IndexedDBManager_1.IndexedDBManager; } });
// Quota manager
var StorageQuotaManager_1 = require("./StorageQuotaManager");
Object.defineProperty(exports, "StorageQuotaManager", { enumerable: true, get: function () { return StorageQuotaManager_1.StorageQuotaManager; } });
Object.defineProperty(exports, "CleanupStrategy", { enumerable: true, get: function () { return StorageQuotaManager_1.CleanupStrategy; } });
// Generic storage
var IndexedDBStorage_1 = require("./IndexedDBStorage");
Object.defineProperty(exports, "IndexedDBStorage", { enumerable: true, get: function () { return IndexedDBStorage_1.IndexedDBStorage; } });
Object.defineProperty(exports, "getDefaultStorage", { enumerable: true, get: function () { return IndexedDBStorage_1.getDefaultStorage; } });
Object.defineProperty(exports, "resetDefaultStorage", { enumerable: true, get: function () { return IndexedDBStorage_1.resetDefaultStorage; } });
// Manifest cache
var IndexedDBManifestCache_1 = require("./IndexedDBManifestCache");
Object.defineProperty(exports, "IndexedDBManifestCache", { enumerable: true, get: function () { return IndexedDBManifestCache_1.IndexedDBManifestCache; } });
Object.defineProperty(exports, "getDefaultManifestCache", { enumerable: true, get: function () { return IndexedDBManifestCache_1.getDefaultManifestCache; } });
Object.defineProperty(exports, "resetDefaultManifestCache", { enumerable: true, get: function () { return IndexedDBManifestCache_1.resetDefaultManifestCache; } });
// Cached playlist loader
var createCachedPlaylistLoader_1 = require("./createCachedPlaylistLoader");
Object.defineProperty(exports, "createCachedPlaylistLoader", { enumerable: true, get: function () { return createCachedPlaylistLoader_1.createCachedPlaylistLoader; } });
Object.defineProperty(exports, "createCachedPlaylistLoaderWithCache", { enumerable: true, get: function () { return createCachedPlaylistLoader_1.createCachedPlaylistLoaderWithCache; } });
// Prefetch utilities
var prefetchManifest_1 = require("./prefetchManifest");
Object.defineProperty(exports, "prefetchManifest", { enumerable: true, get: function () { return prefetchManifest_1.prefetchManifest; } });
Object.defineProperty(exports, "clearCachedManifests", { enumerable: true, get: function () { return prefetchManifest_1.clearCachedManifests; } });
// Types
var types_1 = require("./types");
Object.defineProperty(exports, "StorageEntryType", { enumerable: true, get: function () { return types_1.StorageEntryType; } });
Object.defineProperty(exports, "IndexedDBErrorType", { enumerable: true, get: function () { return types_1.IndexedDBErrorType; } });
Object.defineProperty(exports, "IndexedDBError", { enumerable: true, get: function () { return types_1.IndexedDBError; } });
Object.defineProperty(exports, "STORE_NAMES", { enumerable: true, get: function () { return types_1.STORE_NAMES; } });
Object.defineProperty(exports, "DEFAULT_STORAGE_CONFIG", { enumerable: true, get: function () { return types_1.DEFAULT_STORAGE_CONFIG; } });
//# sourceMappingURL=index.js.map