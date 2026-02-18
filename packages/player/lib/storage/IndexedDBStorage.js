"use strict";
/**
 * IndexedDBStorage - Generic key-value storage using IndexedDB
 *
 * This class provides a simple, generic API for persistent storage
 * with automatic quota management and error handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedDBStorage = void 0;
exports.getDefaultStorage = getDefaultStorage;
exports.resetDefaultStorage = resetDefaultStorage;
var tslib_1 = require("tslib");
var IndexedDBManager_1 = require("./IndexedDBManager");
var StorageQuotaManager_1 = require("./StorageQuotaManager");
var types_1 = require("./types");
/**
 * IndexedDBStorage provides a generic key-value storage API
 */
var IndexedDBStorage = /** @class */ (function () {
    function IndexedDBStorage(config) {
        if (config === void 0) { config = {}; }
        this.initPromise = null;
        this.isInitialized = false;
        this.config = tslib_1.__assign(tslib_1.__assign({}, types_1.DEFAULT_STORAGE_CONFIG), config);
        this.dbManager = new IndexedDBManager_1.IndexedDBManager(this.config);
        this.quotaManager = new StorageQuotaManager_1.StorageQuotaManager(this.dbManager, this.config);
        // eslint-disable-next-line no-console
        this.log = this.config.debug ? function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return console.log.apply(console, tslib_1.__spreadArray(['[IndexedDBStorage]'], args, false));
        } : function () { };
    }
    /**
     * Check if IndexedDB storage is supported
     */
    IndexedDBStorage.isSupported = function () {
        return IndexedDBManager_1.IndexedDBManager.isSupported();
    };
    /**
     * Initialize the storage (opens the database)
     *
     * Note: This method is idempotent - calling it multiple times will only
     * initialize once.
     */
    // eslint-disable-next-line require-await
    IndexedDBStorage.prototype.init = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                if (this.isInitialized) {
                    return [2 /*return*/];
                }
                if (this.initPromise) {
                    return [2 /*return*/, this.initPromise];
                }
                this.initPromise = (function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                    var error_1;
                    return tslib_1.__generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                _a.trys.push([0, 2, , 3]);
                                return [4 /*yield*/, this.dbManager.open()];
                            case 1:
                                _a.sent();
                                this.isInitialized = true;
                                this.log('Storage initialized');
                                return [3 /*break*/, 3];
                            case 2:
                                error_1 = _a.sent();
                                this.log('Failed to initialize storage:', error_1);
                                this.isInitialized = false;
                                this.initPromise = null; // Reset on error to allow retry
                                throw error_1;
                            case 3: return [2 /*return*/];
                        }
                    });
                }); })();
                return [2 /*return*/, this.initPromise];
            });
        });
    };
    /**
     * Ensure the storage is initialized before operations
     */
    IndexedDBStorage.prototype.ensureInitialized = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.isInitialized) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.init()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if the storage is ready
     */
    IndexedDBStorage.prototype.isReady = function () {
        return this.isInitialized && this.dbManager.isReady();
    };
    /**
     * Get the current state
     */
    IndexedDBStorage.prototype.getState = function () {
        return this.dbManager.getState();
    };
    /**
     * Get the default TTL
     */
    IndexedDBStorage.prototype.getDefaultTTL = function () {
        return this.config.defaultTTL;
    };
    /**
     * Store an entry in the specified store
     *
     * @param storeName - The store to write to
     * @param entry - The entry to store
     * @param isRetry - Internal flag to prevent infinite recursion on quota exceeded
     */
    IndexedDBStorage.prototype.put = function (storeName_1, entry_1) {
        return tslib_1.__awaiter(this, arguments, void 0, function (storeName, entry, isRetry) {
            var size, hasSpace, error_2, cleanupError_1;
            if (isRetry === void 0) { isRetry = false; }
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 9]);
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        size = entry.size ? entry.size : 0;
                        return [4 /*yield*/, this.quotaManager.ensureSpace(size)];
                    case 2:
                        hasSpace = _a.sent();
                        if (!hasSpace) {
                            this.log('Not enough space to store entry:', entry.key);
                            return [2 /*return*/, false];
                        }
                        return [4 /*yield*/, this.dbManager.executeWrite(storeName, 
                            /* istanbul ignore next -- @preserve callback executed by mocked dbManager */
                            function (store) { return store.put(entry); })];
                    case 3:
                        _a.sent();
                        this.log('Stored entry:', entry.key, 'in', storeName, 'size:', size);
                        return [2 /*return*/, true];
                    case 4:
                        error_2 = _a.sent();
                        if (!(error_2 instanceof types_1.IndexedDBError &&
                            error_2.errorType === types_1.IndexedDBErrorType.QUOTA_EXCEEDED &&
                            !isRetry)) return [3 /*break*/, 8];
                        // Try cleanup and retry once (isRetry=true prevents infinite recursion)
                        this.log('Quota exceeded, attempting cleanup and retry');
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.quotaManager.cleanup(StorageQuotaManager_1.CleanupStrategy.LRU)];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, this.put(storeName, entry, true)];
                    case 7:
                        cleanupError_1 = _a.sent();
                        this.log('Cleanup and retry failed:', cleanupError_1);
                        return [3 /*break*/, 8];
                    case 8:
                        this.log('Failed to store entry:', entry.key, error_2);
                        return [2 /*return*/, false];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get an entry by key from the specified store
     */
    IndexedDBStorage.prototype.get = function (storeName, key) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var entry, error_3;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.dbManager.executeRead(storeName, 
                            /* istanbul ignore next -- @preserve callback executed by mocked dbManager */
                            function (store) { return store.get(key); })];
                    case 2:
                        entry = _a.sent();
                        if (!entry) {
                            return [2 /*return*/, { found: false, data: null, expired: false }];
                        }
                        this.log('Retrieved entry:', key, 'from', storeName);
                        return [2 /*return*/, { found: true, data: entry, expired: false }];
                    case 3:
                        error_3 = _a.sent();
                        this.log('Failed to get entry:', key, error_3);
                        return [2 /*return*/, { found: false, data: null, expired: false }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete an entry by key from the specified store
     */
    IndexedDBStorage.prototype.delete = function (storeName, key) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var error_4;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.dbManager.executeWrite(storeName, 
                            /* istanbul ignore next -- @preserve callback executed by mocked dbManager */
                            function (store) { return store.delete(key); })];
                    case 2:
                        _a.sent();
                        this.log('Deleted entry:', key, 'from', storeName);
                        return [2 /*return*/, true];
                    case 3:
                        error_4 = _a.sent();
                        this.log('Failed to delete entry:', key, error_4);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if an entry exists in the specified store
     */
    IndexedDBStorage.prototype.has = function (storeName, key) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var count, error_5;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.dbManager.executeRead(storeName, 
                            /* istanbul ignore next -- @preserve callback executed by mocked dbManager */
                            function (store) { return store.count(IDBKeyRange.only(key)); })];
                    case 2:
                        count = _a.sent();
                        return [2 /*return*/, count > 0];
                    case 3:
                        error_5 = _a.sent();
                        this.log('Failed to check entry existence:', key, error_5);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get an entry by index value
     */
    IndexedDBStorage.prototype.getByIndex = function (storeName, indexName, value) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var transaction, store, index_1, error_6;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.dbManager.getTransaction(storeName, 'readonly')];
                    case 2:
                        transaction = _a.sent();
                        store = this.dbManager.getStore(transaction, storeName);
                        index_1 = store.index(indexName);
                        return [2 /*return*/, new Promise(function (resolve) {
                                var request = index_1.get(value);
                                request.onerror = function () {
                                    _this.log('Failed to get by index:', indexName, value, request.error);
                                    resolve({ found: false, data: null, expired: false });
                                };
                                request.onsuccess = function () {
                                    var entry = request.result;
                                    if (!entry) {
                                        resolve({ found: false, data: null, expired: false });
                                        return;
                                    }
                                    _this.log('Retrieved entry by index:', indexName, value);
                                    resolve({ found: true, data: entry, expired: false });
                                };
                            })];
                    case 3:
                        error_6 = _a.sent();
                        this.log('Failed to get by index:', indexName, value, error_6);
                        return [2 /*return*/, { found: false, data: null, expired: false }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get storage statistics
     */
    IndexedDBStorage.prototype.getStats = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, this.quotaManager.getStats()];
                }
            });
        });
    };
    /**
     * Perform a full cleanup using the specified strategy
     */
    IndexedDBStorage.prototype.cleanup = function () {
        return tslib_1.__awaiter(this, arguments, void 0, function (strategy) {
            var result;
            if (strategy === void 0) { strategy = StorageQuotaManager_1.CleanupStrategy.LRU; }
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.quotaManager.cleanup(strategy)];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.entriesRemoved];
                }
            });
        });
    };
    /**
     * Clear all stored data
     */
    IndexedDBStorage.prototype.clear = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.ensureInitialized()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.dbManager.clearAll()];
                    case 2:
                        _a.sent();
                        this.log('All data cleared');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Close the storage connection
     */
    IndexedDBStorage.prototype.close = function () {
        this.dbManager.close();
        this.isInitialized = false;
        this.initPromise = null;
        this.log('Storage closed');
    };
    /**
     * Delete the entire database
     */
    IndexedDBStorage.prototype.destroy = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.dbManager.deleteDatabase()];
                    case 1:
                        _a.sent();
                        this.isInitialized = false;
                        this.log('Storage destroyed');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the underlying database manager (for advanced usage)
     */
    IndexedDBStorage.prototype.getDBManager = function () {
        return this.dbManager;
    };
    /**
     * Get the quota manager (for advanced usage)
     */
    IndexedDBStorage.prototype.getQuotaManager = function () {
        return this.quotaManager;
    };
    return IndexedDBStorage;
}());
exports.IndexedDBStorage = IndexedDBStorage;
/**
 * Singleton instance for convenient global access
 */
var defaultInstance = null;
/**
 * Get or create the default IndexedDBStorage instance
 */
function getDefaultStorage(config) {
    if (!defaultInstance) {
        defaultInstance = new IndexedDBStorage(config);
    }
    return defaultInstance;
}
/**
 * Reset the default instance (useful for testing)
 */
function resetDefaultStorage() {
    if (defaultInstance) {
        defaultInstance.close();
        defaultInstance = null;
    }
}
//# sourceMappingURL=IndexedDBStorage.js.map