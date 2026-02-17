import classNames from 'classnames';
import React from 'react';
var Tooltip = function (_a) {
    var label = _a.label, children = _a.children, _b = _a.placement, placement = _b === void 0 ? 'top' : _b, _c = _a.theme, theme = _c === void 0 ? 'dark' : _c, className = _a.className, style = _a.style;
    if (!label) {
        return children;
    }
    return (React.createElement("div", { "data-test-id": "web-ui-tooltip", className: classNames('web-tooltip', className), style: style },
        React.createElement("div", { className: "web-tooltip__container ".concat(placement, " ").concat(theme) }, label),
        children));
};
export default Tooltip;
//# sourceMappingURL=Tooltip.js.map