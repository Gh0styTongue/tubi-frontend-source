"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interceptorManager = exports.ActionLevel = void 0;
var tools_1 = require("../utils/tools");
var ActionLevel;
(function (ActionLevel) {
    // This one is to ban all level
    ActionLevel[ActionLevel["NONE"] = 0] = "NONE";
    // Player overlay | remote | voice command
    ActionLevel[ActionLevel["UI"] = 1] = "UI";
    // Visibility change in the current situation
    ActionLevel[ActionLevel["VISIBILITY_CHANGE"] = 2] = "VISIBILITY_CHANGE";
    // HDMI toggle | Errors | Others
    ActionLevel[ActionLevel["CODE"] = 3] = "CODE";
    // This one is to allow all level
    ActionLevel[ActionLevel["ALL"] = 4] = "ALL";
})(ActionLevel = exports.ActionLevel || (exports.ActionLevel = {}));
var InterceptorManager = /** @class */ (function () {
    function InterceptorManager() {
        this.interceptors = [];
        this.log = function () { };
    }
    /* istanbul ignore next */
    InterceptorManager.prototype.toggleDebug = function (enableDebug) {
        this.log = enableDebug ? (0, tools_1.debug)('Interceptor') : function () { };
    };
    InterceptorManager.prototype.isMethodAllowed = function (method, level) {
        var _a;
        var interceptors = this.interceptors;
        for (var _i = 0, interceptors_1 = interceptors; _i < interceptors_1.length; _i++) {
            var interceptor = interceptors_1[_i];
            /* istanbul ignore next */
            var allowLevel = (_a = interceptor[method]) === null || _a === void 0 ? void 0 : _a.call(interceptor);
            if (typeof allowLevel === 'number' && allowLevel < level) {
                this.log("".concat(interceptor.name, " ban ").concat(method));
                return false;
            }
        }
        return true;
    };
    InterceptorManager.prototype.hasInterceptor = function (target) {
        return !!this.interceptors.find(function (interceptor) { return interceptor.name === target.name; });
    };
    InterceptorManager.prototype.addInterceptor = function (interceptor) {
        this.log('add interceptor', interceptor);
        if (this.hasInterceptor(interceptor)) {
            return;
        }
        this.interceptors.push(interceptor);
    };
    InterceptorManager.prototype.removeInterceptor = function (target) {
        this.log('remove interceptor', target);
        var index = this.interceptors.findIndex(function (interceptor) { return interceptor.name === target.name; });
        if (index < 0)
            return;
        this.interceptors.splice(index, 1);
    };
    return InterceptorManager;
}());
var singleton = new InterceptorManager();
exports.interceptorManager = singleton;
//# sourceMappingURL=interceptor.js.map