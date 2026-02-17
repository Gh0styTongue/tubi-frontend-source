import { __assign, __rest } from "tslib";
import React, { useCallback } from 'react';
import Tooltip from '../Tooltip/Tooltip';
var IconButton = function (_a) {
    var icon = _a.icon, tooltip = _a.tooltip, _b = _a.className, className = _b === void 0 ? '' : _b, onClick = _a.onClick, onEnter = _a.onEnter, tooltipPlacement = _a.tooltipPlacement, tooltipTheme = _a.tooltipTheme, _c = _a.containerClassName, containerClassName = _c === void 0 ? '' : _c, otherProps = __rest(_a, ["icon", "tooltip", "className", "onClick", "onEnter", "tooltipPlacement", "tooltipTheme", "containerClassName"]);
    var clickHandler = useCallback(function (event) {
        event.stopPropagation();
        onClick === null || onClick === void 0 ? void 0 : onClick(event);
    }, [onClick]);
    var enterHandler = useCallback(function (e) {
        if (onEnter) {
            e.stopPropagation();
            if (e.key === 'Enter') {
                onEnter(e);
            }
        }
    }, [onEnter]);
    return (React.createElement("button", __assign({ className: "web-iconButton-container ".concat(containerClassName) }, otherProps, { onClick: clickHandler, onKeyUp: enterHandler }),
        React.createElement(Tooltip, { label: tooltip, placement: tooltipPlacement, theme: tooltipTheme },
            React.createElement("div", { className: "web-iconButton ".concat(className) }, icon))));
};
export default IconButton;
//# sourceMappingURL=IconButton.js.map