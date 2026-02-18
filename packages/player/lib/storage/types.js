"use strict";
/**
 * IndexedDB Storage Types for Player Package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedDBError = exports.IndexedDBErrorType = exports.STORE_NAMES = exports.DEFAULT_STORAGE_CONFIG = exports.StorageEntryType = void 0;
var tslib_1 = require("tslib");
/**
 * Storage entry types
 */
var StorageEntryType;
(function (StorageEntryType) {
    StorageEntryType["SEGMENT"] = "segment";
    StorageEntryType["MANIFEST"] = "manifest";
})(StorageEntryType || (exports.StorageEntryType = StorageEntryType = {}));
/**
 * Default storage configuration
 */
exports.DEFAULT_STORAGE_CONFIG = {
    dbName: 'TubiPlayerCache',
    dbVersion: 2, // v2: removed contentId index
    maxStorageSize: 100 * 1024 * 1024, // 100MB
    defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
    debug: false,
    cleanupThreshold: 0.9, // 90%
    cleanupTarget: 0.7, // 70%
    openTimeout: 10 * 1000, // 10 seconds
};
/**
 * Object store names
 */
exports.STORE_NAMES = {
    SEGMENTS: 'segments',
    MANIFESTS: 'manifests',
    METADATA: 'metadata',
};
/**
 * Error types for IndexedDB operations
 */
var IndexedDBErrorType;
(function (IndexedDBErrorType) {
    /** Database open failed */
    IndexedDBErrorType["OPEN_ERROR"] = "OPEN_ERROR";
    /** Transaction failed */
    IndexedDBErrorType["TRANSACTION_ERROR"] = "TRANSACTION_ERROR";
    /** Storage quota exceeded */
    IndexedDBErrorType["QUOTA_EXCEEDED"] = "QUOTA_EXCEEDED";
    /** Entry not found */
    IndexedDBErrorType["NOT_FOUND"] = "NOT_FOUND";
    /** Invalid data */
    IndexedDBErrorType["INVALID_DATA"] = "INVALID_DATA";
    /** Database blocked */
    IndexedDBErrorType["BLOCKED"] = "BLOCKED";
    /** Version change error */
    IndexedDBErrorType["VERSION_ERROR"] = "VERSION_ERROR";
    /** Unknown error */
    IndexedDBErrorType["UNKNOWN"] = "UNKNOWN";
    /** IndexedDB not supported */
    IndexedDBErrorType["NOT_SUPPORTED"] = "NOT_SUPPORTED";
})(IndexedDBErrorType || (exports.IndexedDBErrorType = IndexedDBErrorType = {}));
/**
 * Custom error class for IndexedDB operations
 */
var IndexedDBError = /** @class */ (function (_super) {
    tslib_1.__extends(IndexedDBError, _super);
    /* istanbul ignore next -- @preserve constructor branch coverage */
    function IndexedDBError(message, errorType, originalError) {
        var _this = _super.call(this, message) || this;
        _this.name = 'IndexedDBError';
        _this.errorType = errorType;
        _this.originalError = originalError;
        return _this;
    }
    return IndexedDBError;
}(Error));
exports.IndexedDBError = IndexedDBError;
//# sourceMappingURL=types.js.map