import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React from 'react';
export var SpinnerSize;
(function (SpinnerSize) {
    SpinnerSize["SM"] = "sm";
    SpinnerSize["MD"] = "md";
    SpinnerSize["LG"] = "lg";
    SpinnerSize["XL"] = "xl";
})(SpinnerSize || (SpinnerSize = {}));
var Spinner = function (props) {
    var className = props.className, _a = props.size, size = _a === void 0 ? 'sm' : _a, _b = props.theme, theme = _b === void 0 ? 'dark' : _b, restProps = __rest(props, ["className", "size", "theme"]);
    var svgClassName = classNames('web-spinner', className, {
        'web-spinner--light': theme === 'light',
        'web-spinner--sm': size === 'sm',
        'web-spinner--md': size === 'md',
        'web-spinner--lg': size === 'lg',
        'web-spinner--xl': size === 'xl',
    });
    return (React.createElement("svg", __assign({ className: svgClassName, viewBox: "0 0 40 40", preserveAspectRatio: "xMidYMid meet", xmlns: "http://www.w3.org/2000/svg", role: "img" }, restProps),
        React.createElement("title", null, "Web UI Spinner"),
        React.createElement("path", { className: "web-spinner__path", d: "M 20 20 m 18, 0 a 18,18 0 1,0 -36,0", transform: "rotate(-45 20 20)" })));
};
export default Spinner;
//# sourceMappingURL=Spinner.js.map