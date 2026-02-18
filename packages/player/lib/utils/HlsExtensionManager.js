"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HlsExtensionManager = void 0;
var tslib_1 = require("tslib");
var types_1 = require("../types");
var config_1 = require("./config");
var hlsExtension_1 = tslib_1.__importDefault(require("./hlsExtension"));
var constants_1 = require("../constants");
/**
 * HlsExtensionManager manages pre-initialized HLS extensions for video preloading.
 * This allows the detail page to load the extension (load manifest, setup HLS)
 * without creating a player, so playback can start faster when the user decides to play.
 */
var HlsExtensionManager = /** @class */ (function () {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    function HlsExtensionManager() {
        this.cachedExtension = null;
    }
    HlsExtensionManager.getInstance = function () {
        if (!HlsExtensionManager.instance) {
            HlsExtensionManager.instance = new HlsExtensionManager();
        }
        return HlsExtensionManager.instance;
    };
    /**
     * Load and initialize the HLS extension for a given video URL.
     * This will load the manifest and prepare the extension without attaching to a video element.
     *
     * @param url - The video URL to load
     * @param config - Configuration for loading
     * @returns Promise that resolves when the extension is ready (first level loaded)
     */
    HlsExtensionManager.prototype.load = function (url, config) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var extensionConfig, loadExtension, hlsExtensionConfig, ExternalHls;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        extensionConfig = config.extensionConfig;
                        // If we already have a cached extension for this URL, return it
                        if (this.cachedExtension && this.cachedExtension.url === url) {
                            return [2 /*return*/, this.cachedExtension.extension];
                        }
                        // Await clear() to ensure EME cleanup completes before creating new extension
                        return [4 /*yield*/, this.clear()];
                    case 1:
                        // Await clear() to ensure EME cleanup completes before creating new extension
                        _a.sent();
                        if (!(0, types_1.isHlsExtensionConfig)(extensionConfig)) {
                            return [2 /*return*/, null];
                        }
                        loadExtension = function (currentUrl, currentConfig, HlsClass) {
                            var currentExtensionConfig = currentConfig.extensionConfig, currentDebug = currentConfig.debug, currentAbrRuleMode = currentConfig.abrRuleMode, currentEnableHlsCacheFragments = currentConfig.enableHlsCacheFragments, currentLicenseUrl = currentConfig.licenseUrl, currentDrmKeySystem = currentConfig.drmKeySystem, currentMaxLevelResolution = currentConfig.maxLevelResolution, currentOnErrorFallback = currentConfig.onErrorFallback;
                            if (!(0, types_1.isHlsExtensionConfig)(currentExtensionConfig)) {
                                return null;
                            }
                            var _a = currentExtensionConfig.relyOnAutoplayAttribute, relyOnAutoplayAttribute = _a === void 0 ? false : _a;
                            currentExtensionConfig.hls.startFragPrefetch = true;
                            currentExtensionConfig.hls.enablePreloadBuffer = true;
                            var hlsConfig = {
                                url: currentUrl,
                                debug: currentDebug,
                                hls: (0, config_1.buildHlsConfig)({ licenseUrl: currentLicenseUrl, drmKeySystem: currentDrmKeySystem, extensionConfig: currentExtensionConfig }),
                                enablePreInitExtension: true,
                                relyOnAutoplayAttribute: relyOnAutoplayAttribute,
                                abrRuleMode: currentAbrRuleMode,
                                enableHlsCacheFragments: currentEnableHlsCacheFragments,
                                maxLevelResolution: currentMaxLevelResolution,
                                videoElement: undefined,
                            };
                            var extension = new hlsExtension_1.default(hlsConfig, HlsClass);
                            var errorHandler = function (error) { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var e_1, fallbackResult;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (this.cachedExtension && this.cachedExtension.extension === extension) {
                                                this.cachedExtension = null;
                                            }
                                            _a.label = 1;
                                        case 1:
                                            _a.trys.push([1, 3, , 4]);
                                            return [4 /*yield*/, extension.destroy()];
                                        case 2:
                                            _a.sent();
                                            return [3 /*break*/, 4];
                                        case 3:
                                            e_1 = _a.sent();
                                            return [3 /*break*/, 4];
                                        case 4:
                                            // Try fallback to a different video resource
                                            if (currentOnErrorFallback) {
                                                fallbackResult = currentOnErrorFallback(error);
                                                if (fallbackResult) {
                                                    loadExtension(fallbackResult.url, fallbackResult.config, HlsClass);
                                                }
                                            }
                                            return [2 /*return*/];
                                    }
                                });
                            }); };
                            extension.on(constants_1.PLAYER_EVENTS.error, errorHandler);
                            _this.cachedExtension = {
                                extension: extension,
                                url: currentUrl,
                                createdAt: Date.now(),
                                errorHandler: errorHandler,
                            };
                            return extension;
                        };
                        // If Hls is already loaded, use it directly
                        if (HlsExtensionManager.Hls) {
                            loadExtension(url, config, HlsExtensionManager.Hls);
                            return [2 /*return*/, null];
                        }
                        hlsExtensionConfig = extensionConfig;
                        if (!hlsExtensionConfig.externalHlsResolver) {
                            throw new Error('externalHlsResolver is required for load');
                        }
                        return [4 /*yield*/, hlsExtensionConfig.externalHlsResolver];
                    case 2:
                        ExternalHls = _a.sent();
                        HlsExtensionManager.Hls = ExternalHls;
                        loadExtension(url, config, ExternalHls);
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Get the cached extension for a URL.
     * Returns null if no extension exists or if it's for a different URL.
     *
     * @param url - The URL to check
     * @returns The cached extension or null
     */
    HlsExtensionManager.prototype.get = function (url) {
        if (this.cachedExtension && this.cachedExtension.url === url) {
            return this.cachedExtension;
        }
        return null;
    };
    /**
     * Consume the cached extension (get and clear it).
     * Use this when the player is ready to use the cached extension.
     *
     * @param url - The URL to consume
     * @returns The cached extension or null
     */
    HlsExtensionManager.prototype.consume = function (url) {
        var extension = this.get(url);
        if (extension) {
            var errorHandler = extension.errorHandler;
            extension.extension.removeListener(constants_1.PLAYER_EVENTS.error, errorHandler);
            this.cachedExtension = null;
            return extension;
        }
        return null;
    };
    /**
     * Check if there's a cached extension for a URL
     */
    HlsExtensionManager.prototype.has = function (url) {
        var _a;
        return ((_a = this.cachedExtension) === null || _a === void 0 ? void 0 : _a.url) === url;
    };
    /**
     * Clear the cached extension and destroy it.
     * Returns a Promise that resolves when the extension is destroyed (for DRM cleanup).
     */
    HlsExtensionManager.prototype.clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, extension, errorHandler, e_2;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.cachedExtension) return [3 /*break*/, 4];
                        _a = this.cachedExtension, extension = _a.extension, errorHandler = _a.errorHandler;
                        extension.removeListener(constants_1.PLAYER_EVENTS.error, errorHandler);
                        this.cachedExtension = null;
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, extension.destroy()];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_2 = _b.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the URL of the current cached extension.
     */
    HlsExtensionManager.prototype.getUrl = function () {
        var _a;
        return ((_a = this.cachedExtension) === null || _a === void 0 ? void 0 : _a.url) || null;
    };
    return HlsExtensionManager;
}());
exports.HlsExtensionManager = HlsExtensionManager;
//# sourceMappingURL=HlsExtensionManager.js.map