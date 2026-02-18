"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Xhr = void 0;
var Xhr = /** @class */ (function () {
    function Xhr() {
    }
    Xhr.prototype.stop = function () {
        if (this.active) {
            this.active.abort();
            this.active = undefined;
        }
    };
    Xhr.prototype.load = function (url, responseType, retries, timeout) {
        var _this = this;
        if (this.active !== undefined) {
            return Promise.reject(new Error('only one simultaneous request supported'));
        }
        var startTime = Date.now();
        return new Promise(function (resolve) {
            var xhr = _this.active = new XMLHttpRequest();
            xhr.open('GET', url);
            if (timeout) {
                xhr.timeout = timeout;
            }
            if (responseType !== 'text') {
                xhr.responseType = responseType;
            }
            xhr.onabort = function () {
                resolve({ type: 'abort', retry: false, xhr: xhr });
            };
            xhr.onload = function () {
                resolve({ type: 'load', retry: xhr.status < 200 || xhr.status >= 400, xhr: xhr });
            };
            xhr.onerror = function () {
                resolve({ type: 'error', retry: true, xhr: xhr });
            };
            xhr.ontimeout = function () {
                resolve({ type: 'timeout', retry: true, xhr: xhr });
            };
            xhr.send();
        }).then(function (response) {
            _this.active = undefined;
            var timeLeft = timeout - (Date.now() - startTime);
            if ((response.retry && retries === 0) || response.type === 'abort' || (response.retry && retries > 0 && timeLeft <= 0)) {
                var message = "error loading ".concat(response.type);
                if (response.xhr.status !== 0) {
                    message += " ".concat(response.xhr.status);
                }
                return Promise.reject(new Error(message));
            }
            if (response.retry) {
                return _this.load(url, responseType, retries - 1, timeLeft);
            }
            return response.xhr;
        }).catch(function (err) {
            // this should not happen. if it does though we
            // need to reset the active request and pass
            // along the error.
            _this.active = undefined;
            return Promise.reject(err);
        });
    };
    return Xhr;
}());
exports.Xhr = Xhr;
//# sourceMappingURL=xhr.js.map