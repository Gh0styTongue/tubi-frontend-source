"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlobFetcher = void 0;
var preloader_1 = require("./preloader");
var noop = function () { };
var BlobFetcher = /** @class */ (function () {
    function BlobFetcher() {
    }
    BlobFetcher.prototype.fetch = function (url, timeout, context) {
        if (timeout === void 0) { timeout = 5000; }
        if (!url) {
            return Object.assign(Promise.resolve({
                status: preloader_1.FetchStatus.Error,
                response: { code: 403, message: 'Empty string provided.' },
            }), { cancel: noop });
        }
        var cancel = noop;
        var promise = new Promise(function (resolve) {
            var responseHeaders = {};
            var done = function (status, response) {
                resolve({ status: status, response: response, context: context, responseHeaders: responseHeaders });
            };
            var xhr = new XMLHttpRequest();
            xhr.timeout = timeout;
            xhr.responseType = 'arraybuffer';
            xhr.addEventListener('load', function () {
                var blob = new Blob([xhr.response], { type: 'video/mp4' });
                var blobUrl = URL.createObjectURL(blob);
                var size = xhr.response.byteLength;
                done(preloader_1.FetchStatus.Success, { response: blobUrl, size: size, code: xhr.status, message: xhr.statusText });
            });
            xhr.addEventListener('readystatechange', function () {
                var _a;
                if (xhr.readyState >= xhr.HEADERS_RECEIVED) {
                    /* istanbul ignore next */
                    var headers = (_a = xhr.getAllResponseHeaders()) !== null && _a !== void 0 ? _a : '';
                    // Convert the header string into an array
                    // of individual headers
                    var arr = headers.trim().split(/[\r\n]+/);
                    arr.forEach(function (line) {
                        var lowerCaseLine = line.toLowerCase();
                        var parts = lowerCaseLine.split(': ');
                        if (parts.length > 1) {
                            var header = parts[0];
                            responseHeaders[header] = lowerCaseLine;
                        }
                    });
                }
            });
            xhr.addEventListener('error', function () { return done(preloader_1.FetchStatus.Error, { code: xhr.status, message: xhr.statusText }); });
            xhr.addEventListener('timeout', function () { return done(preloader_1.FetchStatus.Timeout); });
            xhr.addEventListener('abort', function () { return done(preloader_1.FetchStatus.Cancelled); });
            xhr.open('GET', url);
            xhr.send();
            cancel = function () {
                xhr.abort();
            };
        });
        return Object.assign(promise, { cancel: cancel });
    };
    return BlobFetcher;
}());
exports.BlobFetcher = BlobFetcher;
//# sourceMappingURL=blobFetcher.js.map