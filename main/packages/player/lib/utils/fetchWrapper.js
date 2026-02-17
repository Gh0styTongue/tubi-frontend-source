"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xhrRequest = exports.fetchWrapper = exports.blobToArrayBuffer = void 0;
var tslib_1 = require("tslib");
// eslint-disable-next-line no-restricted-imports
var unfetch_1 = tslib_1.__importDefault(require("unfetch"));
/**
 * The fetch polyfill we are using, `unfetch`, does not support the arrayBuffer
 * method on the response object. This is a workaround to convert blob to
 * arrayBuffer.
 */
function blobToArrayBuffer(blob) {
    return new Promise(function (resolve, reject) {
        var fileReader = new FileReader();
        fileReader.onload = function () {
            if (fileReader.result instanceof ArrayBuffer) {
                return resolve(fileReader.result);
            }
            // this should be unreachable; it's the else case for a type guard
            // but we throw to make it visible just in case
            /* istanbul ignore next */
            reject(new Error('FileReader did not return an ArrayBuffer'));
        };
        /* istanbul ignore next */
        fileReader.onerror = function (err) {
            reject(err);
        };
        fileReader.readAsArrayBuffer(blob);
    });
}
exports.blobToArrayBuffer = blobToArrayBuffer;
/**
 * The built-in fetch is not feature-comlpete on certain platforms (e.g. Sony).
 * This is a thin wrapper around the `unfetch` polyfill to enhance its
 * functionality. It will allow us to swap out the polyfill in the future if
 * needed.
 *
 * (For example, we know that on Sony, fetch has a very strict interpretation
 * of the CORS spec, and response bodies will often not be readable even for
 * same-origin requests. Falling back on XHR via a polyfill solves this.)
 *
 * On browsers where fetch is not implemented at all, global fetch polyfills
 * outside the player package will provide a polyfill when feature detection
 * fails. When fetch exists but is incomplete, `forceFetchPolyfill` needs to
 * be set to true.
 */
function fetchWrapper(path, options, forceFetchPolyfill) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var unfetchResponse;
        var _this = this;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!forceFetchPolyfill) {
                        // eslint-disable-next-line tubitv-player/no-fetch
                        return [2 /*return*/, fetch(path, options)];
                    }
                    return [4 /*yield*/, (0, unfetch_1.default)(path, options)];
                case 1:
                    unfetchResponse = _a.sent();
                    return [2 /*return*/, tslib_1.__assign(tslib_1.__assign({}, unfetchResponse), { arrayBuffer: function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
                                var blob;
                                return tslib_1.__generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, unfetchResponse.blob()];
                                        case 1:
                                            blob = _a.sent();
                                            return [2 /*return*/, blobToArrayBuffer(blob)];
                                    }
                                });
                            }); } })];
            }
        });
    });
}
exports.fetchWrapper = fetchWrapper;
/**
 * This thin wrapper around the XMLHttpRequest object is the first iteration
 * to replace the use of fetch and its polyfill. The response object returned
 * by this function is similar to the one returned by fetchWrapper in order to
 * make the testing between the two easier.
 *
 * Once we migrate all the fetch calls to this function, we can remove the
 * unnecessary methods in the response object such as arrayBuffer.
 */
function xhrRequest(url, options) {
    var maxRetries = options.maxRetries;
    var getJitter = function (retryCount) {
        var baseDelay = 1000 * (Math.pow(retryCount, 2));
        var jitter = Math.random() * 100;
        return baseDelay + jitter;
    };
    var shouldRetry = function (attempts) {
        if (!maxRetries)
            return false;
        return attempts < maxRetries;
    };
    var requestWithRetry = function (retryCount) {
        if (retryCount === void 0) { retryCount = 0; }
        /* istanbul ignore next: unreachable as it is overwritten within promise */
        var cancel = function () { };
        var createErrorWithRetries = function (message) {
            var error = new Error(message);
            error.retries = retryCount;
            return error;
        };
        var promise = new Promise(function (resolve, reject) {
            var request = new XMLHttpRequest();
            var keys = [];
            var headers = {};
            var retryDelayTimeoutId;
            var response = function () {
                var _a;
                return ({
                    ok: request.status >= 200 && request.status < 300,
                    statusText: request.statusText,
                    status: request.status,
                    url: (_a = request.responseURL) !== null && _a !== void 0 ? _a : url,
                    retries: retryCount,
                    text: function () { return Promise.resolve(request.responseText); },
                    json: function () {
                        if (request.responseType !== 'json') {
                            if (typeof request.response === 'string') {
                                return Promise.resolve(request.response).then(JSON.parse);
                            }
                            return Promise.reject(new Error("Response is not JSON: responseType: ".concat(request.responseType, ", Content-Type: ").concat(request.getResponseHeader('Content-Type'))));
                        }
                        return Promise.resolve(request.response);
                    },
                    blob: function () { return Promise.resolve(new Blob([request.response])); },
                    headers: {
                        keys: function () { return keys; },
                        entries: function () { return keys.map(function (n) { return [n, request.getResponseHeader(n) || '']; }); },
                        get: function (n) { var _a; return (_a = request.getResponseHeader(n)) !== null && _a !== void 0 ? _a : undefined; },
                        has: function (n) { return request.getResponseHeader(n) !== null; },
                    },
                    arrayBuffer: function () {
                        if (request.responseType !== 'arraybuffer') {
                            return Promise.reject(new Error('Response is not an ArrayBuffer'));
                        }
                        return Promise.resolve(request.response);
                    },
                });
            };
            request.open(options.method || 'get', url, true);
            request.onload = function () {
                request.getAllResponseHeaders()
                    .toLowerCase()
                    .replace(/^(.+?):/gm, function (_m, key) {
                    headers[key] || keys.push((headers[key] = key));
                    return key;
                });
                if (request.status >= 200 && request.status < 300) {
                    resolve(response());
                }
                else if (request.status === 500 && shouldRetry(retryCount)) {
                    var delay = getJitter(retryCount);
                    retryDelayTimeoutId = setTimeout(function () {
                        requestWithRetry(retryCount + 1)
                            .then(resolve)
                            .catch(reject);
                    }, delay);
                }
                else {
                    reject(createErrorWithRetries("Request failed with status ".concat(request.status)));
                }
            };
            request.onerror = function () {
                reject(createErrorWithRetries("Request failed with status ".concat(request.status, " and readyState ").concat(request.readyState)));
            };
            request.onabort = function () {
                clearTimeout(retryDelayTimeoutId);
                reject(createErrorWithRetries('Request was aborted'));
            };
            request.withCredentials = options.credentials === 'include';
            if (options.timeout) {
                request.timeout = options.timeout;
                request.ontimeout = function () {
                    if (shouldRetry(retryCount)) {
                        var delay = getJitter(retryCount);
                        retryDelayTimeoutId = setTimeout(function () {
                            requestWithRetry(retryCount + 1)
                                .then(resolve)
                                .catch(reject);
                        }, delay);
                    }
                    else {
                        reject(createErrorWithRetries('Request timed out'));
                    }
                };
            }
            request.responseType = options.responseType;
            if (options.headers) {
                for (var _i = 0, _a = Object.keys(options.headers); _i < _a.length; _i++) {
                    var key = _a[_i];
                    request.setRequestHeader(key, options.headers[key]);
                }
            }
            cancel = function () {
                request.abort();
            };
            request.send(options.body);
        });
        return Object.assign(promise, { cancel: cancel });
    };
    return requestWithRetry();
}
exports.xhrRequest = xhrRequest;
//# sourceMappingURL=fetchWrapper.js.map