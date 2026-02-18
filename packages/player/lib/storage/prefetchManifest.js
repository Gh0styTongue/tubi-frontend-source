"use strict";
/**
 * Prefetch and cache HLS manifests to IndexedDB
 *
 * This utility downloads and parses HLS manifests, caching them for later use.
 * It handles both master playlists and media playlists, recursively fetching
 * all variant playlists from a master playlist.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prefetchManifest = prefetchManifest;
exports.clearCachedManifests = clearCachedManifests;
var tslib_1 = require("tslib");
var IndexedDBManifestCache_1 = require("./IndexedDBManifestCache");
var fetchWrapper_1 = require("../utils/fetchWrapper");
/**
 * Check if URL is an m3u8 file
 */
function isM3u8Url(url) {
    var urlLower = url.toLowerCase();
    return urlLower.includes('.m3u8') || urlLower.includes('format=m3u8');
}
/**
 * Resolve a relative URL against a base URL
 */
function resolveUrl(baseUrl, relativeUrl) {
    // If it's already absolute, return as-is
    if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
        return relativeUrl;
    }
    // Parse base URL
    var baseUrlObj = new URL(baseUrl);
    // If relative URL starts with /, it's relative to origin
    if (relativeUrl.startsWith('/')) {
        return "".concat(baseUrlObj.origin).concat(relativeUrl);
    }
    // Otherwise, it's relative to the current path
    var basePath = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    return "".concat(basePath).concat(relativeUrl);
}
/**
 * Parse an HLS playlist to extract variant URLs
 */
function parsePlaylist(content, baseUrl) {
    var lines = content.split('\n').map(function (line) { return line.trim(); });
    var variantUrls = [];
    var audioUrls = [];
    var isMaster = false;
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        // Check for master playlist indicators
        if (line.startsWith('#EXT-X-STREAM-INF:')) {
            isMaster = true;
            // Next non-empty, non-comment line is the variant URL
            for (var j = i + 1; j < lines.length; j++) {
                var nextLine = lines[j];
                if (nextLine && !nextLine.startsWith('#')) {
                    variantUrls.push(resolveUrl(baseUrl, nextLine));
                    break;
                }
            }
        }
        // Check for audio renditions
        if (line.startsWith('#EXT-X-MEDIA:') && line.includes('TYPE=AUDIO')) {
            var uriMatch = line.match(/URI="([^"]+)"/);
            if (uriMatch && uriMatch[1]) {
                audioUrls.push(resolveUrl(baseUrl, uriMatch[1]));
            }
        }
    }
    return {
        isMaster: isMaster,
        content: content,
        variantUrls: variantUrls,
        audioUrls: audioUrls,
    };
}
/**
 * Fetch a manifest with timeout
 */
function fetchManifest(url, options, log) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var timeout, response, error_1;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    timeout = options.timeout ? options.timeout : 10000;
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, (0, fetchWrapper_1.xhrRequest)(url, {
                            method: 'GET',
                            headers: options.headers,
                            timeout: timeout,
                            responseType: 'text',
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        log("Failed to fetch ".concat(url, ": ").concat(response.status, " ").concat(response.statusText));
                        return [2 /*return*/, null];
                    }
                    return [4 /*yield*/, response.text()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    error_1 = _a.sent();
                    log("Error fetching ".concat(url, ":"), error_1);
                    return [2 /*return*/, null];
                case 5: return [2 /*return*/];
            }
        });
    });
}
/**
 * Prefetch and cache HLS manifests
 *
 * @param url - The m3u8 URL to prefetch
 * @param options - Prefetch options
 * @returns Result of the prefetch operation
 */
function prefetchManifest(url_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function (url, options) {
        var result, log, cache, content, parsed, mainType, cached, variantFetchPromises, variantResults, variantStorePromises, audioFetchPromises, audioResults, audioStorePromises, error_2;
        var _this = this;
        if (options === void 0) { options = {}; }
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    result = {
                        success: false,
                        cachedCount: 0,
                        cachedUrls: [],
                        errors: [],
                    };
                    log = options.debug ? function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        return console.log.apply(console, tslib_1.__spreadArray(['[PrefetchManifest]'], args, false));
                    } : function () { };
                    // Check if URL is m3u8
                    if (!isM3u8Url(url)) {
                        log('URL is not an m3u8 file:', url);
                        result.errors.push({ url: url, error: 'Not an m3u8 URL' });
                        return [2 /*return*/, result];
                    }
                    // Check if IndexedDB is supported
                    if (!IndexedDBManifestCache_1.IndexedDBManifestCache.isSupported()) {
                        log('IndexedDB is not supported');
                        result.errors.push({ url: url, error: 'IndexedDB not supported' });
                        return [2 /*return*/, result];
                    }
                    cache = (0, IndexedDBManifestCache_1.getDefaultManifestCache)(undefined, {
                        debug: options.debug,
                        enabled: true,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 10, , 11]);
                    // Initialize cache (will be a no-op if already initialized)
                    return [4 /*yield*/, cache.init()];
                case 2:
                    // Initialize cache (will be a no-op if already initialized)
                    _a.sent();
                    if (!cache.isReady()) {
                        log('Cache is not ready');
                        result.errors.push({ url: url, error: 'Cache initialization failed' });
                        return [2 /*return*/, result];
                    }
                    // Fetch the master/main manifest
                    log('Fetching manifest:', url);
                    return [4 /*yield*/, fetchManifest(url, options, log)];
                case 3:
                    content = _a.sent();
                    if (!content) {
                        result.errors.push({ url: url, error: 'Failed to fetch manifest' });
                        return [2 /*return*/, result];
                    }
                    parsed = parsePlaylist(content, url);
                    log('Parsed manifest - isMaster:', parsed.isMaster, 'variants:', parsed.variantUrls.length, 'audio:', parsed.audioUrls.length);
                    mainType = parsed.isMaster ? 'manifest' : 'level';
                    return [4 /*yield*/, cache.storeManifest(url, content, mainType)];
                case 4:
                    cached = _a.sent();
                    if (cached) {
                        result.cachedCount++;
                        result.cachedUrls.push(url);
                        log('Cached manifest:', url);
                    }
                    if (!parsed.isMaster) return [3 /*break*/, 9];
                    variantFetchPromises = parsed.variantUrls.map(function (variantUrl) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var variantContent;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    log('Fetching variant playlist:', variantUrl);
                                    return [4 /*yield*/, fetchManifest(variantUrl, options, log)];
                                case 1:
                                    variantContent = _a.sent();
                                    return [2 /*return*/, { variantUrl: variantUrl, variantContent: variantContent }];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(variantFetchPromises)];
                case 5:
                    variantResults = _a.sent();
                    variantStorePromises = variantResults.map(function (_a) { return tslib_1.__awaiter(_this, [_a], void 0, function (_b) {
                        var variantCached;
                        var variantUrl = _b.variantUrl, variantContent = _b.variantContent;
                        return tslib_1.__generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    if (!variantContent) return [3 /*break*/, 2];
                                    return [4 /*yield*/, cache.storeManifest(variantUrl, variantContent, 'level')];
                                case 1:
                                    variantCached = _c.sent();
                                    if (variantCached) {
                                        result.cachedCount++;
                                        result.cachedUrls.push(variantUrl);
                                        log('Cached variant playlist:', variantUrl);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    result.errors.push({ url: variantUrl, error: 'Failed to fetch variant' });
                                    _c.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(variantStorePromises)];
                case 6:
                    _a.sent();
                    audioFetchPromises = parsed.audioUrls.map(function (audioUrl) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                        var audioContent;
                        return tslib_1.__generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    log('Fetching audio playlist:', audioUrl);
                                    return [4 /*yield*/, fetchManifest(audioUrl, options, log)];
                                case 1:
                                    audioContent = _a.sent();
                                    return [2 /*return*/, { audioUrl: audioUrl, audioContent: audioContent }];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(audioFetchPromises)];
                case 7:
                    audioResults = _a.sent();
                    audioStorePromises = audioResults.map(function (_a) { return tslib_1.__awaiter(_this, [_a], void 0, function (_b) {
                        var audioCached;
                        var audioUrl = _b.audioUrl, audioContent = _b.audioContent;
                        return tslib_1.__generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    if (!audioContent) return [3 /*break*/, 2];
                                    return [4 /*yield*/, cache.storeManifest(audioUrl, audioContent, 'audioTrack')];
                                case 1:
                                    audioCached = _c.sent();
                                    if (audioCached) {
                                        result.cachedCount++;
                                        result.cachedUrls.push(audioUrl);
                                        log('Cached audio playlist:', audioUrl);
                                    }
                                    return [3 /*break*/, 3];
                                case 2:
                                    result.errors.push({ url: audioUrl, error: 'Failed to fetch audio playlist' });
                                    _c.label = 3;
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(audioStorePromises)];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    result.success = result.cachedCount > 0;
                    log('Prefetch complete. Cached:', result.cachedCount, 'Errors:', result.errors.length);
                    return [2 /*return*/, result];
                case 10:
                    error_2 = _a.sent();
                    log('Prefetch error:', error_2);
                    result.errors.push({ url: url, error: String(error_2) });
                    return [2 /*return*/, result];
                case 11: return [2 /*return*/];
            }
        });
    });
}
/**
 * Clear all cached manifests
 *
 * @param options - Options
 */
function clearCachedManifests() {
    return tslib_1.__awaiter(this, arguments, void 0, function (options) {
        var log, cache, error_3;
        if (options === void 0) { options = {}; }
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    log = options.debug ? function () {
                        var args = [];
                        for (var _i = 0; _i < arguments.length; _i++) {
                            args[_i] = arguments[_i];
                        }
                        return console.log.apply(console, tslib_1.__spreadArray(['[ClearManifests]'], args, false));
                    } : function () { };
                    if (!IndexedDBManifestCache_1.IndexedDBManifestCache.isSupported()) {
                        log('IndexedDB is not supported');
                        return [2 /*return*/, false];
                    }
                    cache = (0, IndexedDBManifestCache_1.getDefaultManifestCache)(undefined, {
                        debug: options.debug,
                        enabled: true,
                    });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, cache.init()];
                case 2:
                    _a.sent();
                    if (!cache.isReady()) {
                        log('Cache is not ready');
                        return [2 /*return*/, false];
                    }
                    return [4 /*yield*/, cache.clear()];
                case 3:
                    _a.sent();
                    log('Cleared all cached manifests');
                    return [2 /*return*/, true];
                case 4:
                    error_3 = _a.sent();
                    log('Error clearing cache:', error_3);
                    return [2 /*return*/, false];
                case 5: return [2 /*return*/];
            }
        });
    });
}
//# sourceMappingURL=prefetchManifest.js.map