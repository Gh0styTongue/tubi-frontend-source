"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clear = exports.resolve = void 0;
var resources = {};
function hash(url, attributes) {
    return "".concat(url, ":").concat(JSON.stringify(attributes));
}
function load(url, attributes) {
    return new Promise(function (resolve, reject) {
        var script = document.createElement('script');
        script.src = url;
        Object.keys(attributes).forEach(function (key) {
            script.setAttribute(key, attributes[key]);
        });
        script.onload = function () { return resolve(); };
        script.onerror = function () {
            reject(new Error("Fail to load \"".concat(url, "\"")));
            (0, exports.clear)(url);
        };
        document.head.appendChild(script);
    });
}
var resolve = function (url, attributes) {
    if (attributes === void 0) { attributes = {}; }
    var key = hash(url, attributes);
    if (!resources[key]) {
        resources[key] = load(url, attributes);
    }
    return resources[key];
};
exports.resolve = resolve;
var clear = function (url) {
    if (!url) {
        resources = {};
        return;
    }
    Object.keys(resources).forEach(function (key) {
        if (key.startsWith("".concat(url, ":"))) {
            delete resources[key];
        }
    });
};
exports.clear = clear;
//# sourceMappingURL=resolver.js.map