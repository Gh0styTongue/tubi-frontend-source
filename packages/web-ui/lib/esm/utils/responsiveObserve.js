/**
 * Originally copied from:
 * https://github.com/ant-design/ant-design/blob/ae43c269c3ecfcd76ec457132e102daf8f29e788/components/_util/responsiveObserve.ts
 *
 * License (MIT):
 * https://github.com/ant-design/ant-design/blob/master/LICENSE
 */
var _a;
import { __assign } from "tslib";
var Breakpoint;
(function (Breakpoint) {
    Breakpoint["xs"] = "xs";
    Breakpoint["sm"] = "sm";
    Breakpoint["sMd"] = "sMd";
    Breakpoint["md"] = "md";
    Breakpoint["lg"] = "lg";
    Breakpoint["xl"] = "xl";
    Breakpoint["xxl"] = "xxl";
})(Breakpoint || (Breakpoint = {}));
// The breakpoints matches the same mapping defined in
// https://github.com/adRise/www/blob/924eaf07e6e978ad6936d7265a446e88faa237f2/packages/web-ui/src/styles/_responsive.scss#L13-L21.
export var responsiveMap = (_a = {},
    _a[Breakpoint.xs] = '(max-width: 374px)',
    _a[Breakpoint.sm] = '(min-width: 375px)',
    _a[Breakpoint.sMd] = '(min-width: 540px)',
    _a[Breakpoint.md] = '(min-width: 768px)',
    _a[Breakpoint.lg] = '(min-width: 960px)',
    _a[Breakpoint.xl] = '(min-width: 1170px)',
    _a[Breakpoint.xxl] = '(min-width: 1440px)',
    _a);
var responsiveArray = Object.keys(responsiveMap);
var subscribers = new Map();
var subUid = -1;
var screens = {};
var responsiveObserve = {
    matchHandlers: {},
    dispatch: function (pointMap) {
        screens = pointMap;
        subscribers.forEach(function (func) { return func(screens); });
        return subscribers.size >= 1;
    },
    subscribe: function (func) {
        if (!subscribers.size)
            this.register();
        subUid += 1;
        subscribers.set(subUid, func);
        func(screens);
        return subUid;
    },
    unsubscribe: function (token) {
        subscribers.delete(token);
        if (!subscribers.size)
            this.unregister();
    },
    unregister: function () {
        var _this = this;
        responsiveArray.forEach(function (screen) {
            var matchMediaQuery = responsiveMap[screen];
            var handler = _this.matchHandlers[matchMediaQuery];
            handler === null || handler === void 0 ? void 0 : handler.mql.removeListener(handler === null || handler === void 0 ? void 0 : handler.listener);
        });
        subscribers.clear();
    },
    register: function () {
        var _this = this;
        responsiveArray.forEach(function (screen) {
            var matchMediaQuery = responsiveMap[screen];
            var listener = function (_a) {
                var _b;
                var matches = _a.matches;
                _this.dispatch(__assign(__assign({}, screens), (_b = {}, _b[screen] = matches, _b)));
            };
            var mql = window.matchMedia(matchMediaQuery);
            mql.addListener(listener);
            _this.matchHandlers[matchMediaQuery] = {
                mql: mql,
                listener: listener,
            };
            listener(mql);
        });
    },
};
export default responsiveObserve;
//# sourceMappingURL=responsiveObserve.js.map