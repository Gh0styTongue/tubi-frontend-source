import classNames from 'classnames';
import React, { memo } from 'react';
import { bemBlock } from '../../utils/bem';
var bem = bemBlock('web-label');
function Label(_a) {
    var _b;
    var outline = _a.outline, rounded = _a.rounded, _c = _a.color, color = _c === void 0 ? 'white' : _c, children = _a.children, icon = _a.icon, className = _a.className, _d = _a.size, size = _d === void 0 ? 'default' : _d, style = _a.style;
    var labelClass = classNames(bem.block, bem.modifier("size-".concat(size)), (_b = {},
        _b[bem.modifier("outline-".concat(color))] = outline,
        _b[bem.modifier("color-".concat(color))] = !outline,
        _b[bem.modifier('rounded')] = rounded,
        _b));
    var iconClass = classNames(bem.element('icon'), bem.elementModifier('icon', "size-".concat(size)));
    var contentClass = classNames(bem.element('content'), bem.elementModifier('content', "size-".concat(size)));
    return (React.createElement("div", { "data-test-id": "web-ui-label", className: classNames(labelClass, className), style: style },
        icon ? React.createElement("div", { className: iconClass }, icon) : null,
        React.createElement("div", { className: contentClass }, children)));
}
export default memo(Label);
//# sourceMappingURL=Label.js.map