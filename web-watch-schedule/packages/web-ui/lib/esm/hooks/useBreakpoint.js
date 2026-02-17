/**
 * Orinianlly copied from:
 * https://github.com/ant-design/ant-design/blame/106acb7d5ba63a5a9095550b240b2cfe37a15a11/components/grid/hooks/useBreakpoint.tsx
 *
 * License (MIT):
 * https://github.com/ant-design/ant-design/blob/master/LICENSE
 */
import { useEffect, useState } from 'react';
import ResponsiveObserve from '../utils/responsiveObserve';
var useBreakpointDefault = function (defaultValue) {
    var _a = useState(defaultValue), screens = _a[0], setScreens = _a[1];
    useEffect(function () {
        var token = ResponsiveObserve.subscribe(function (supportScreens) {
            setScreens(supportScreens);
        });
        return function () { return ResponsiveObserve.unsubscribe(token); };
    }, []);
    return screens;
};
/**
 * Get the current matched breakpoints if the app has initialized on the client,
 * otherwise (as in an SSR scenario) return `undefined`.
 */
export var useBreakpointIfAvailable = function () {
    return useBreakpointDefault(undefined);
};
export var useBreakpoint = function (
// The defaultScreens is used to make sure it awalys returns sreen values even in non-window environments like SSR.
// Thus for SSR, it assumes that the default screen is a desktop screen whose size is xxl. However, it's totally up
// to the consumer that a different defaultScreens can be passed-in, for example to simulate a mobile screen.
defaultScreens) {
    if (defaultScreens === void 0) { defaultScreens = {
        xs: false,
        sm: true,
        sMd: true,
        md: true,
        lg: true,
        xl: true,
        xxl: true,
    }; }
    return useBreakpointDefault(defaultScreens);
};
//# sourceMappingURL=useBreakpoint.js.map