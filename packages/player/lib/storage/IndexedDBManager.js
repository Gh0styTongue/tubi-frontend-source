"use strict";
/**
 * IndexedDBManager - Core class for managing IndexedDB lifecycle and operations
 *
 * Features:
 * - Database lifecycle management (open, close, delete)
 * - Simple version control
 * - Error handling and fault tolerance
 * - Connection pooling and state management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexedDBManager = void 0;
var tslib_1 = require("tslib");
var types_1 = require("./types");
/**
 * IndexedDBManager handles the core IndexedDB operations with proper
 * lifecycle management, error handling, and version control.
 */
var IndexedDBManager = /** @class */ (function () {
    function IndexedDBManager(config) {
        if (config === void 0) { config = {}; }
        this.db = null;
        this.state = 'closed';
        this.openPromise = null;
        this.config = tslib_1.__assign(tslib_1.__assign({}, types_1.DEFAULT_STORAGE_CONFIG), config);
        // eslint-disable-next-line no-console
        this.log = this.config.debug ? function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return console.log.apply(console, tslib_1.__spreadArray(['[IndexedDBManager]'], args, false));
        } : function () { };
    }
    /**
     * Check if IndexedDB is supported in the current environment
     */
    IndexedDBManager.isSupported = function () {
        if (typeof indexedDB === 'undefined') {
            return false;
        }
        try {
            // Try to access indexedDB to ensure it's not blocked
            return !!indexedDB;
        }
        catch (_a) {
            return false;
        }
    };
    /**
     * Get the current database state
     */
    IndexedDBManager.prototype.getState = function () {
        return this.state;
    };
    /**
     * Get the current configuration
     */
    IndexedDBManager.prototype.getConfig = function () {
        return tslib_1.__assign({}, this.config);
    };
    /**
     * Check if the database is open and ready
     */
    IndexedDBManager.prototype.isReady = function () {
        return this.state === 'open' && this.db !== null;
    };
    /**
     * Create the database schema
     */
    IndexedDBManager.prototype.createSchema = function (db) {
        this.log('Creating database schema, version:', this.config.dbVersion);
        // Create segments store
        if (!db.objectStoreNames.contains(types_1.STORE_NAMES.SEGMENTS)) {
            var segmentStore = db.createObjectStore(types_1.STORE_NAMES.SEGMENTS, {
                keyPath: 'key',
            });
            segmentStore.createIndex('timestamp', 'timestamp', { unique: false });
            segmentStore.createIndex('level', 'level', { unique: false });
            this.log('Created segments store');
        }
        // Create manifests store
        if (!db.objectStoreNames.contains(types_1.STORE_NAMES.MANIFESTS)) {
            var manifestStore = db.createObjectStore(types_1.STORE_NAMES.MANIFESTS, {
                keyPath: 'key',
            });
            manifestStore.createIndex('timestamp', 'timestamp', { unique: false });
            manifestStore.createIndex('url', 'url', { unique: false });
            this.log('Created manifests store');
        }
        // Create metadata store
        if (!db.objectStoreNames.contains(types_1.STORE_NAMES.METADATA)) {
            var metadataStore = db.createObjectStore(types_1.STORE_NAMES.METADATA, {
                keyPath: 'key',
            });
            metadataStore.createIndex('updatedAt', 'updatedAt', { unique: false });
            this.log('Created metadata store');
        }
    };
    /**
     * Set up database event handlers
     */
    IndexedDBManager.prototype.setupDatabaseHandlers = function () {
        var _this = this;
        /* istanbul ignore if -- @preserve defensive guard, db is always set when this is called */
        if (!this.db)
            return;
        // Set up close handler
        this.db.onclose = function () {
            _this.log('Database closed unexpectedly');
            _this.state = 'closed';
            _this.db = null;
        };
        // Set up error handler
        this.db.onerror = function (event) {
            _this.log('Database error:', event);
        };
        // Set up versionchange handler for handling upgrades from other tabs
        this.db.onversionchange = function () {
            _this.log('Version change detected, closing connection');
            _this.close();
        };
    };
    /**
     * Open the database connection
     */
    IndexedDBManager.prototype.open = function () {
        var _this = this;
        // Return existing connection if open and valid
        if (this.isReady() && this.db) {
            return Promise.resolve(this.db);
        }
        // Return pending open promise if already opening
        if (this.state === 'opening' && this.openPromise) {
            return Promise.resolve(this.openPromise).then(function (db) { return db; });
        }
        // Check IndexedDB support
        if (!IndexedDBManager.isSupported()) {
            this.state = 'error';
            throw new types_1.IndexedDBError('IndexedDB is not supported in this environment', types_1.IndexedDBErrorType.NOT_SUPPORTED);
        }
        this.state = 'opening';
        this.log('Opening database:', this.config.dbName, 'version:', this.config.dbVersion);
        // Track if operation completed to prevent timeout from interfering after success/failure
        var operationCompleted = false;
        var openDatabasePromise = new Promise(function (resolve, reject) {
            try {
                var request_1 = indexedDB.open(_this.config.dbName, _this.config.dbVersion);
                request_1.onerror = function () {
                    var _a;
                    if (operationCompleted) {
                        // Timeout already fired, ignore this late error
                        return;
                    }
                    operationCompleted = true;
                    _this.state = 'error';
                    _this.openPromise = null;
                    var error = new types_1.IndexedDBError("Failed to open database: ".concat(((_a = request_1.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'), types_1.IndexedDBErrorType.OPEN_ERROR, request_1.error || undefined);
                    _this.log('Open error:', error);
                    reject(error);
                };
                request_1.onsuccess = function () {
                    if (operationCompleted) {
                        // Timeout already fired, ignore this late success
                        // Close the connection to avoid resource leak
                        request_1.result.close();
                        return;
                    }
                    operationCompleted = true;
                    _this.db = request_1.result;
                    _this.state = 'open';
                    _this.openPromise = null;
                    _this.setupDatabaseHandlers();
                    _this.log('Database opened successfully');
                    resolve(_this.db);
                };
                request_1.onupgradeneeded = function () {
                    var db = request_1.result;
                    _this.createSchema(db);
                };
                request_1.onblocked = function () {
                    _this.log('Database open blocked - another connection is open');
                    // Don't reject here, wait for the block to be resolved
                };
            }
            catch (error) {
                operationCompleted = true;
                _this.state = 'error';
                _this.openPromise = null;
                var wrappedError = new types_1.IndexedDBError("Failed to initiate database open: ".concat(error.message), types_1.IndexedDBErrorType.OPEN_ERROR, error);
                reject(wrappedError);
            }
        });
        // Create timeout promise to prevent hanging indefinitely
        var timeoutPromise = new Promise(function (_, reject) {
            setTimeout(function () {
                if (!operationCompleted) {
                    operationCompleted = true;
                    _this.state = 'error';
                    _this.openPromise = null;
                    _this.log('Database open timed out after', _this.config.openTimeout, 'ms');
                    reject(new types_1.IndexedDBError("Database open timed out after ".concat(_this.config.openTimeout, "ms"), types_1.IndexedDBErrorType.OPEN_ERROR));
                }
            }, _this.config.openTimeout);
        });
        this.openPromise = Promise.race([openDatabasePromise, timeoutPromise]);
        return this.openPromise;
    };
    /**
     * Close the database connection
     */
    IndexedDBManager.prototype.close = function () {
        if (this.db) {
            this.log('Closing database');
            this.db.close();
            this.db = null;
        }
        this.state = 'closed';
        this.openPromise = null;
    };
    /**
     * Delete the entire database
     *
     * Note: If an open operation is in progress, this will wait for it to
     * complete (or fail) before proceeding with deletion.
     */
    IndexedDBManager.prototype.deleteDatabase = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a;
            var _this = this;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!IndexedDBManager.isSupported()) {
                            throw new types_1.IndexedDBError('IndexedDB is not supported', types_1.IndexedDBErrorType.NOT_SUPPORTED);
                        }
                        if (!this.openPromise) return [3 /*break*/, 4];
                        this.log('Waiting for pending open operation before deleting');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.openPromise];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        _a = _b.sent();
                        return [3 /*break*/, 4];
                    case 4:
                        // Close existing connection
                        this.close();
                        this.log('Deleting database:', this.config.dbName);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var request = indexedDB.deleteDatabase(_this.config.dbName);
                                request.onerror = function () {
                                    var _a;
                                    var error = new types_1.IndexedDBError("Failed to delete database: ".concat(((_a = request.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'), types_1.IndexedDBErrorType.OPEN_ERROR, request.error || undefined);
                                    _this.log('Delete error:', error);
                                    reject(error);
                                };
                                request.onsuccess = function () {
                                    _this.log('Database deleted successfully');
                                    resolve();
                                };
                                request.onblocked = function () {
                                    _this.log('Database deletion blocked - closing all connections');
                                    // The deletion will proceed once all connections are closed
                                };
                            })];
                }
            });
        });
    };
    /**
     * Get a transaction for the specified stores
     */
    IndexedDBManager.prototype.getTransaction = function (storeNames_1) {
        return tslib_1.__awaiter(this, arguments, void 0, function (storeNames, mode) {
            var db, stores;
            if (mode === void 0) { mode = 'readonly'; }
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.open()];
                    case 1:
                        db = _a.sent();
                        stores = Array.isArray(storeNames) ? storeNames : [storeNames];
                        try {
                            return [2 /*return*/, db.transaction(stores, mode)];
                        }
                        catch (error) {
                            throw new types_1.IndexedDBError("Failed to create transaction: ".concat(error.message), types_1.IndexedDBErrorType.TRANSACTION_ERROR, error);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get an object store from a transaction
     */
    IndexedDBManager.prototype.getStore = function (transaction, storeName) {
        try {
            return transaction.objectStore(storeName);
        }
        catch (error) {
            throw new types_1.IndexedDBError("Failed to get object store '".concat(storeName, "': ").concat(error.message), types_1.IndexedDBErrorType.TRANSACTION_ERROR, error);
        }
    };
    /**
     * Execute a read operation with automatic retry and error handling
     */
    IndexedDBManager.prototype.executeRead = function (storeName, operation) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var transaction, store;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTransaction(storeName, 'readonly')];
                    case 1:
                        transaction = _a.sent();
                        store = this.getStore(transaction, storeName);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                try {
                                    var request_2 = operation(store);
                                    request_2.onerror = function () {
                                        var _a;
                                        reject(new types_1.IndexedDBError("Read operation failed: ".concat(((_a = request_2.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'), types_1.IndexedDBErrorType.TRANSACTION_ERROR, request_2.error || undefined));
                                    };
                                    request_2.onsuccess = function () {
                                        resolve(request_2.result);
                                    };
                                }
                                catch (error) {
                                    reject(new types_1.IndexedDBError("Read operation failed: ".concat(error.message), types_1.IndexedDBErrorType.TRANSACTION_ERROR, error));
                                }
                            })];
                }
            });
        });
    };
    /**
     * Execute a write operation with automatic error handling
     */
    IndexedDBManager.prototype.executeWrite = function (storeName, operation) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var transaction, store;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTransaction(storeName, 'readwrite')];
                    case 1:
                        transaction = _a.sent();
                        store = this.getStore(transaction, storeName);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                try {
                                    var request_3 = operation(store);
                                    request_3.onerror = function () {
                                        var _a, _b;
                                        var errorMessage = ((_a = request_3.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error';
                                        var isQuotaError = ((_b = request_3.error) === null || _b === void 0 ? void 0 : _b.name) === 'QuotaExceededError' ||
                                            errorMessage.toLowerCase().includes('quota');
                                        reject(new types_1.IndexedDBError("Write operation failed: ".concat(errorMessage), isQuotaError
                                            ? types_1.IndexedDBErrorType.QUOTA_EXCEEDED
                                            : types_1.IndexedDBErrorType.TRANSACTION_ERROR, request_3.error || undefined));
                                    };
                                    request_3.onsuccess = function () {
                                        resolve(request_3.result);
                                    };
                                    transaction.onerror = function () {
                                        var _a;
                                        var errorMessage = ((_a = transaction.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error';
                                        reject(new types_1.IndexedDBError("Transaction failed: ".concat(errorMessage), types_1.IndexedDBErrorType.TRANSACTION_ERROR, transaction.error || undefined));
                                    };
                                }
                                catch (error) {
                                    reject(new types_1.IndexedDBError("Write operation failed: ".concat(error.message), types_1.IndexedDBErrorType.TRANSACTION_ERROR, error));
                                }
                            })];
                }
            });
        });
    };
    /**
     * Execute a batch write operation
     */
    IndexedDBManager.prototype.executeBatchWrite = function (storeName, operations) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var transaction, store;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getTransaction(storeName, 'readwrite')];
                    case 1:
                        transaction = _a.sent();
                        store = this.getStore(transaction, storeName);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                try {
                                    for (var _i = 0, operations_1 = operations; _i < operations_1.length; _i++) {
                                        var op = operations_1[_i];
                                        if (op.type === 'put' && op.data !== undefined) {
                                            store.put(op.data);
                                        }
                                        else if (op.type === 'delete' && op.key !== undefined) {
                                            store.delete(op.key);
                                        }
                                    }
                                    transaction.oncomplete = function () {
                                        resolve();
                                    };
                                    transaction.onerror = function () {
                                        var _a;
                                        reject(new types_1.IndexedDBError("Batch write failed: ".concat(((_a = transaction.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unknown error'), types_1.IndexedDBErrorType.TRANSACTION_ERROR, transaction.error || undefined));
                                    };
                                }
                                catch (error) {
                                    reject(new types_1.IndexedDBError("Batch write failed: ".concat(error.message), types_1.IndexedDBErrorType.TRANSACTION_ERROR, error));
                                }
                            })];
                }
            });
        });
    };
    /**
     * Count entries in a store
     */
    IndexedDBManager.prototype.count = function (storeName) {
        return this.executeRead(storeName, function (store) { return store.count(); });
    };
    /**
     * Clear all entries in a store
     */
    IndexedDBManager.prototype.clearStore = function (storeName) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.executeWrite(storeName, function (store) { return store.clear(); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Clear all stores
     */
    IndexedDBManager.prototype.clearAll = function () {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var storeNames;
            var _this = this;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        storeNames = Object.values(types_1.STORE_NAMES);
                        return [4 /*yield*/, Promise.all(storeNames.map(function (storeName) { return _this.clearStore(storeName); }))];
                    case 1:
                        _a.sent();
                        this.log('All stores cleared');
                        return [2 /*return*/];
                }
            });
        });
    };
    return IndexedDBManager;
}());
exports.IndexedDBManager = IndexedDBManager;
//# sourceMappingURL=IndexedDBManager.js.map