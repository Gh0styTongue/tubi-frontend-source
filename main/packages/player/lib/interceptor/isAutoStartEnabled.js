"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAutoStartEnabled = void 0;
var interceptor_1 = require("./interceptor");
function isAutoStartEnabled(config) {
    var _a;
    var autoStart = config.autoStart || ((_a = config.getAutoStart) === null || _a === void 0 ? void 0 : _a.call(config));
    return !!autoStart
        && interceptor_1.interceptorManager.isMethodAllowed('play', interceptor_1.ActionLevel.CODE);
}
exports.isAutoStartEnabled = isAutoStartEnabled;
//# sourceMappingURL=isAutoStartEnabled.js.map