"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Preloader = exports.noop = exports.FetchStatus = void 0;
var defaultFetcher_1 = require("./defaultFetcher");
var doublyLinkedList_1 = require("../doublyLinkedList");
var sizeBasedLRU_1 = __importDefault(require("../sizeBasedLRU"));
var FetchStatus;
(function (FetchStatus) {
    FetchStatus[FetchStatus["Success"] = 0] = "Success";
    FetchStatus[FetchStatus["Error"] = 1] = "Error";
    FetchStatus[FetchStatus["Timeout"] = 2] = "Timeout";
    FetchStatus[FetchStatus["Cancelled"] = 3] = "Cancelled";
})(FetchStatus = exports.FetchStatus || (exports.FetchStatus = {}));
function makeNode(request) {
    return new doublyLinkedList_1.DoublyLinkedNode(request.url, request);
}
var noop = function () { };
exports.noop = noop;
var DEFAULT_MAX_CACHE_SIZE = 1000000; // 1 MB
var DEFAULT_MAX_CONCURRENT_REQUESTS = 4;
var Preloader = /** @class */ (function () {
    function Preloader(preloadFetcher, options) {
        if (options === void 0) { options = {}; }
        this.inFlight = new Map();
        this.pendingPromises = new Map();
        this.queue = new doublyLinkedList_1.DoublyLinkedList();
        this.logs = [];
        if (preloadFetcher) {
            this.fetcher = preloadFetcher;
        }
        else {
            this.fetcher = new defaultFetcher_1.DefaultFetcher();
        }
        this.options = __assign({ maxCacheSize: DEFAULT_MAX_CACHE_SIZE, maxConcurrentRequests: DEFAULT_MAX_CONCURRENT_REQUESTS, debug: false }, options);
        this.loadedUrls = new sizeBasedLRU_1.default(this.options.maxCacheSize, { onEviction: this.options.onEviction });
    }
    Preloader.prototype.restoreDefaultFetcher = function () {
        this.fetcher = new defaultFetcher_1.DefaultFetcher();
    };
    Preloader.prototype.add = function (url, priority, timeout, context) {
        var isInFlight = this.inFlight.has(url);
        if (isInFlight || this.isLoaded(url)) {
            return;
        }
        var maxInFlightPriority = this.maxInFlightPriority();
        var pendingRequestForSameUrl = this.findInQueue(url);
        var isMaxConcurrentRequestsReached = this.inFlight.size >= this.options.maxConcurrentRequests;
        if (priority <= maxInFlightPriority && !pendingRequestForSameUrl && isMaxConcurrentRequestsReached) {
            this.enqueue({ url: url, priority: priority, timeout: timeout, context: context });
        }
        else if (pendingRequestForSameUrl) {
            // update priority by removing and re-adding in correct place (which might be as a fetched request)
            this.queue.remove(pendingRequestForSameUrl);
            this.add(url, priority, timeout, context);
        }
        else {
            this.fetch(url, priority, timeout, context);
        }
        this.debug('add', context);
    };
    Preloader.prototype.addAll = function (urls, priority, timeout, context) {
        var _this = this;
        urls.forEach(function (url) { return _this.add(url, priority, timeout, context); });
    };
    Preloader.prototype.setAsUtilized = function (url) {
        if (this.isLoaded(url)) {
            this.loadedUrls.setAsUtilized(url);
        }
    };
    Preloader.prototype.debug = function (source, context) {
        var _a;
        var queuedRequests = this.queue.values();
        var status = __spreadArray(__spreadArray(__spreadArray(__spreadArray([
            'In-flight requests:'
        ], (this.inFlight.size === 0
            ? ['  (none)']
            : Array.from(this.inFlight.values()).map(debugRequestMapFunction)), true), [
            '',
            'Queued requests:'
        ], false), (queuedRequests.length === 0
            ? ['  (none)']
            : queuedRequests.map(debugRequestMapFunction)), true), [
            '',
            "LRU Cache Capacity: ".concat(((this.loadedUrls.size / this.options.maxCacheSize) * 100).toFixed(2), "%"),
            '',
            'Fetch Data:',
            '',
            context ? JSON.stringify(context) : '(none)',
        ], false).join('\n');
        if (this.options.debug) {
            // eslint-disable-next-line no-console
            console.log("[Preloader] -> ".concat(source, ": \n"), status);
        }
        /**
         * This is a log of the last 5 actions taken by the preloader.
         */
        this.logs.push((_a = {},
            _a[source] = __assign({ inflight: Array.from(this.inFlight.values()).length, queued: queuedRequests.length, loaded: this.loadedUrls.values().length, cacheSize: this.loadedUrls.size, capacity: ((this.loadedUrls.size / this.options.maxCacheSize) * 100).toFixed(2) }, (context ? { context: context } : {})),
            _a));
        if (this.logs.length > 5) {
            this.logs.shift();
        }
        return status;
    };
    Preloader.prototype.getDebugInfo = function () {
        var logs = this.logs.reduce(function (accumulator, currentValue, index) {
            accumulator[index] = currentValue;
            return accumulator;
        }, {});
        return logs;
    };
    Preloader.prototype.getPriority = function (url) {
        var _a;
        if (this.inFlight.has(url)) {
            return this.inFlight.get(url).priority;
        }
        var pendingNode = this.findInQueue(url);
        return (_a = pendingNode === null || pendingNode === void 0 ? void 0 : pendingNode.val.priority) !== null && _a !== void 0 ? _a : null;
    };
    Preloader.prototype.isLoaded = function (url) {
        return this.loadedUrls.has(url);
    };
    Preloader.prototype.isKnown = function (url) {
        return this.isInFlight(url) || this.isLoaded(url) || !!this.findInQueue(url);
    };
    Preloader.prototype.isInFlight = function (url) {
        return this.inFlight.has(url);
    };
    Preloader.prototype.getPromiseFor = function (url) {
        var cachedResponse = this.loadedUrls.get(url);
        if (cachedResponse !== undefined) {
            return Promise.resolve(cachedResponse);
        }
        var pendingPromise = this.pendingPromises.get(url);
        if (!pendingPromise) {
            var resolve_1 = exports.noop;
            var reject_1 = exports.noop;
            var promise = new Promise(function (res, rej) {
                resolve_1 = res;
                reject_1 = rej;
            });
            pendingPromise = { resolve: resolve_1, reject: reject_1, promise: promise };
            this.pendingPromises.set(url, pendingPromise);
        }
        return pendingPromise.promise;
    };
    Preloader.prototype.isInQueue = function (url) {
        return this.findInQueue(url) !== null;
    };
    Preloader.prototype.remove = function (url, unload) {
        var isInFlight = this.inFlight.has(url);
        if (isInFlight) {
            this.inFlight.get(url).promise.cancel();
            this.inFlight.delete(url);
        }
        var pendingRequest = isInFlight ? null : this.findInQueue(url);
        if (pendingRequest) {
            this.queue.remove(pendingRequest);
        }
        if (unload && this.isLoaded(url)) {
            this.loadedUrls.remove(url);
        }
        this.debug('remove');
    };
    Preloader.prototype.removeAll = function (urls) {
        var _this = this;
        urls.forEach(function (url) { return _this.remove(url); });
    };
    Preloader.prototype.reset = function (keepInFlightPromise) {
        if (keepInFlightPromise === void 0) { keepInFlightPromise = false; }
        if (!keepInFlightPromise) {
            this.inFlight.forEach(function (_a) {
                var promise = _a.promise;
                return promise.cancel();
            });
        }
        this.inFlight.clear();
        this.inFlight = new Map();
        this.queue.clear();
        this.queue = new doublyLinkedList_1.DoublyLinkedList();
        this.loadedUrls.clear();
        this.loadedUrls = new sizeBasedLRU_1.default(this.options.maxCacheSize, { onEviction: this.options.onEviction });
        this.pendingPromises = new Map();
    };
    Preloader.prototype.setMaxConcurrentRequests = function (n) {
        var _this = this;
        if (n <= 0)
            throw new Error("Max concurrent requests cannot be ".concat(n === 0 ? 'zero' : 'negative'));
        if (this.options.maxConcurrentRequests !== n) {
            var difference = n - this.options.maxConcurrentRequests;
            this.options.maxConcurrentRequests = n;
            if (difference > 0) {
                for (var i = 0; i < difference; i++) {
                    this.tryFetchNext();
                }
            }
            else if (difference < 0 && this.inFlight.size > n) {
                var inPriorityOrder = Array.from(this.inFlight.values()).sort(function (a, b) { return a.priority - b.priority; });
                var numToCancel = this.inFlight.size - n;
                inPriorityOrder.slice(0, numToCancel).forEach(function (_a) {
                    var url = _a.url, priority = _a.priority, timeout = _a.timeout, context = _a.context;
                    _this.remove(url);
                    _this.add(url, priority, timeout, context);
                });
            }
        }
    };
    Preloader.prototype.enqueue = function (request) {
        var nodeToInsertBefore = this.queue.find(function (_a) {
            var priority = _a.val.priority;
            return priority < request.priority;
        });
        var node = makeNode(request);
        if (!nodeToInsertBefore) {
            this.queue.push(node);
        }
        else {
            this.queue.insertBefore(nodeToInsertBefore, node);
        }
    };
    Preloader.prototype.fetch = function (url, priority, timeout, fetchContext) {
        var _this = this;
        var fetchPromise = this.fetcher.fetch(url, timeout, fetchContext);
        var inFlightRequest = { url: url, priority: priority, timeout: timeout, promise: fetchPromise };
        this.inFlight.set(url, inFlightRequest);
        fetchPromise.then(function (_a) {
            var _b, _c, _d, _e, _f, _g, _h, _j;
            var status = _a.status, response = _a.response, context = _a.context, responseHeaders = _a.responseHeaders;
            var pendingPromise = _this.pendingPromises.get(url);
            switch (status) {
                case FetchStatus.Timeout:
                    (_c = (_b = _this.options).onTimeout) === null || _c === void 0 ? void 0 : _c.call(_b, context, responseHeaders);
                    pendingPromise === null || pendingPromise === void 0 ? void 0 : pendingPromise.reject(new Error('Request timed out'));
                    _this.pendingPromises.delete(url);
                    break;
                case FetchStatus.Cancelled:
                    (_e = (_d = _this.options).onAbort) === null || _e === void 0 ? void 0 : _e.call(_d, context, responseHeaders);
                    pendingPromise === null || pendingPromise === void 0 ? void 0 : pendingPromise.reject(new Error('Request was cancelled'));
                    _this.pendingPromises.delete(url);
                    break;
                case FetchStatus.Success:
                    if (response !== undefined) {
                        _this.loadedUrls.set(url, response, context);
                        (_g = (_f = _this.options).onSuccess) === null || _g === void 0 ? void 0 : _g.call(_f, response, context, responseHeaders);
                        _this.debug('set', context);
                        pendingPromise === null || pendingPromise === void 0 ? void 0 : pendingPromise.resolve(response);
                        _this.pendingPromises.delete(url);
                    }
                    break;
                default:
                    (_j = (_h = _this.options).onError) === null || _j === void 0 ? void 0 : _j.call(_h, response, context, responseHeaders);
                    pendingPromise === null || pendingPromise === void 0 ? void 0 : pendingPromise.reject(new Error('Error fetching resource'));
                    _this.pendingPromises.delete(url);
                    break;
            }
            _this.inFlight.delete(url);
            _this.tryFetchNext();
        });
    };
    Preloader.prototype.findInQueue = function (url) {
        return this.queue.find(function (_a) {
            var key = _a.key;
            return key === url;
        });
    };
    Preloader.prototype.maxInFlightPriority = function () {
        var priorities = Array.from(this.inFlight.values()).map(function (_a) {
            var priority = _a.priority;
            return priority;
        });
        return Math.max.apply(Math, __spreadArray(__spreadArray([], priorities, false), [0], false));
    };
    Preloader.prototype.tryFetchNext = function () {
        if (this.inFlight.size >= this.options.maxConcurrentRequests)
            return;
        var nextRequest = this.queue.shift();
        if (nextRequest) {
            this.fetch(nextRequest.val.url, nextRequest.val.priority, nextRequest.val.timeout, nextRequest.val.context);
        }
    };
    return Preloader;
}());
exports.Preloader = Preloader;
function debugRequestMapFunction(_a, index) {
    var url = _a.url, priority = _a.priority, timeout = _a.timeout;
    return "  ".concat(index + 1, ". Priority: ").concat(priority, ", Timeout: ").concat(timeout === undefined ? 'N/A' : "".concat(timeout, "ms"), ", URL: ").concat(url);
}
//# sourceMappingURL=preloader.js.map