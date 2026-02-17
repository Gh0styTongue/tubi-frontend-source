"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A simple Promise manager capable of tracking pending promises, adding timeouts, and aborting them.
 */
var PromiseManager = /** @class */ (function () {
    function PromiseManager() {
        this.pendingHandlerList = [];
    }
    PromiseManager.prototype.createPromise = function (executor, options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var handler = _this.start(resolve, reject, options);
            var result = executor(handler.wrappedResolve, handler.wrappedReject);
            if (result && result.onReject) {
                handler.onReject = result.onReject;
            }
        });
    };
    /**
     * Start to track a promise
     * `options.onReject` could be used to do some destructions when rejected
     */
    PromiseManager.prototype.start = function (resolve, reject, options) {
        var _this = this;
        var _a;
        if (options === void 0) { options = {}; }
        var onSettled = function () {
            handler.settled = true;
            if (handler.timer)
                clearTimeout(handler.timer);
            _this.stop(handler);
        };
        var handler = {
            wrappedResolve: function (value) {
                if (handler.settled)
                    return;
                onSettled();
                resolve(value);
            },
            wrappedReject: function (reason) {
                var _a;
                if (handler.settled)
                    return;
                onSettled();
                (_a = handler.onReject) === null || _a === void 0 ? void 0 : _a.call(handler);
                reject(reason);
            },
            onReject: options.onReject,
            settled: false,
            name: (_a = options.handlerName) !== null && _a !== void 0 ? _a : '',
        };
        if (options.timeout) {
            handler.timer = setTimeout(function () {
                var _a;
                (_a = options.timeoutCallback) === null || _a === void 0 ? void 0 : _a.call(options);
                handler.wrappedReject(new Error("Promise timeout ".concat(handler.name)));
            }, options.timeout);
        }
        this.pendingHandlerList.push(handler);
        return handler;
    };
    /**
     * Stop tracking a promise
     */
    PromiseManager.prototype.stop = function (handler) {
        var index = this.pendingHandlerList.indexOf(handler);
        if (index !== -1)
            this.pendingHandlerList.splice(index, 1);
    };
    /**
     * Abort a promise
     */
    PromiseManager.prototype.abort = function (handler, message) {
        var wrappedReject = handler.wrappedReject, name = handler.name;
        wrappedReject(new Error(message || "Promise aborted ".concat(name)));
    };
    /**
     * Abort all tracking promises
     */
    PromiseManager.prototype.abortAll = function (message) {
        var handler;
        do {
            handler = this.pendingHandlerList.pop();
            if (handler) {
                this.abort(handler, message);
            }
        } while (handler);
    };
    return PromiseManager;
}());
exports.default = PromiseManager;
//# sourceMappingURL=promiseManager.js.map