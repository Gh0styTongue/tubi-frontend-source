"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var preloader_1 = require("@adrise/utils/lib/preloader");
var blobFetcher_1 = require("@adrise/utils/lib/preloader/blobFetcher");
var initializeAdPreloaderFactory = function () {
    var adPreloader;
    return function (config) {
        if (adPreloader)
            return adPreloader;
        var maxCacheSize = config.maxCacheSize, maxConcurrentRequests = config.maxConcurrentRequests, debug = config.debug, onError = config.onError, onEviction = config.onEviction, onTimeout = config.onTimeout, onAbort = config.onAbort, onSuccess = config.onSuccess;
        var adBlobFetcher = new blobFetcher_1.BlobFetcher();
        adPreloader = new preloader_1.Preloader(adBlobFetcher, {
            maxCacheSize: maxCacheSize,
            maxConcurrentRequests: maxConcurrentRequests,
            debug: debug,
            onError: onError,
            onEviction: onEviction,
            onTimeout: onTimeout,
            onAbort: onAbort,
            onSuccess: onSuccess,
        });
        return adPreloader;
    };
};
var createAdPreloader = initializeAdPreloaderFactory();
exports.default = createAdPreloader;
//# sourceMappingURL=AdPreloader.js.map