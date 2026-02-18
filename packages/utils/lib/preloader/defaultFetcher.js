"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultFetcher = void 0;
var preloader_1 = require("./preloader");
var noop = function () { };
var DefaultFetcher = /** @class */ (function () {
    function DefaultFetcher() {
    }
    DefaultFetcher.prototype.fetch = function (url, timeout) {
        if (timeout === void 0) { timeout = 5000; }
        if (!url)
            return Object.assign(Promise.resolve({ status: preloader_1.FetchStatus.Success }), { cancel: noop });
        var cancel = noop;
        var promise = new Promise(function (resolve) {
            var done = function (status) {
                clearTimeout(timer);
                resolve({ status: status });
            };
            var timer = setTimeout(function () {
                done(preloader_1.FetchStatus.Timeout);
            }, timeout);
            var request = new XMLHttpRequest();
            request.addEventListener('load', function () { return done(preloader_1.FetchStatus.Success); });
            request.addEventListener('error', function () { return done(preloader_1.FetchStatus.Error); });
            request.addEventListener('timeout', function () { return done(preloader_1.FetchStatus.Timeout); });
            request.open('GET', url);
            request.send();
            cancel = function () {
                request.abort();
                done(preloader_1.FetchStatus.Cancelled);
            };
        });
        return Object.assign(promise, { cancel: cancel });
    };
    return DefaultFetcher;
}());
exports.DefaultFetcher = DefaultFetcher;
//# sourceMappingURL=defaultFetcher.js.map