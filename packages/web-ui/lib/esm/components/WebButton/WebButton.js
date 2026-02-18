import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React, { forwardRef } from 'react';
import { bemBlock } from '../../utils/bem';
import Spinner, { SpinnerSize } from '../Spinner/Spinner';
import Tooltip from '../Tooltip/Tooltip';
var bem = bemBlock('web-button');
// Prior art:
// https://github.com/adRise/web_ui/blob/0bf974c75dabe9b29967da369a5a5eb4f2aa3989/src/Button
var WebButton = forwardRef(function (_a, ref) {
    var _b, _c;
    var onClick = _a.onClick, className = _a.className, disabled = _a.disabled, _d = _a.style, style = _d === void 0 ? {} : _d, children = _a.children, Icon = _a.icon, tag = _a.tag, _e = _a.appearance, appearance = _e === void 0 ? 'primary' : _e, _f = _a.size, size = _f === void 0 ? 'medium' : _f, _g = _a.textAlign, textAlign = _g === void 0 ? 'center' : _g, loading = _a.loading, tooltip = _a.tooltip, tooltipPlacement = _a.tooltipPlacement, tooltipTheme = _a.tooltipTheme, _h = _a.iconSize, iconSize = _h === void 0 ? 'default' : _h, _j = _a.iconAlignment, iconAlignment = _j === void 0 ? 'default' : _j, type = _a.type, otherProps = __rest(_a, ["onClick", "className", "disabled", "style", "children", "icon", "tag", "appearance", "size", "textAlign", "loading", "tooltip", "tooltipPlacement", "tooltipTheme", "iconSize", "iconAlignment", "type"]);
    var classes = classNames(bem.block, className, (_b = {},
        _b[bem.modifier('primary')] = appearance === 'primary',
        _b[bem.modifier('secondary')] = appearance === 'secondary',
        _b[bem.modifier('tertiary')] = appearance === 'tertiary',
        _b[bem.modifier('small')] = size === 'small',
        _b[bem.modifier('has-icon')] = !!Icon,
        _b[bem.modifier('has-icon-no-content')] = !!Icon && !children,
        _b[bem.modifier('loading')] = loading,
        _b[bem.modifier('has-tooltip')] = !!tooltip,
        _b));
    var iconClasses = classNames('web-button__icon', (_c = {},
        _c[bem.elementModifier('icon', 'no-content')] = !children,
        _c[bem.elementModifier('icon', 'size-large')] = iconSize === 'large',
        _c[bem.elementModifier('icon', 'align-left')] = iconAlignment === 'left',
        _c));
    var contentStyle = {
        textAlign: textAlign,
    };
    return (React.createElement("button", __assign({ "data-test-id": "web-ui-web-button", className: classes, disabled: disabled || loading, style: style, onClick: onClick, ref: ref, type: type }, otherProps),
        React.createElement(Tooltip, { className: bem.element('tooltip'), label: tooltip, placement: tooltipPlacement, theme: tooltipTheme }, loading ? (React.createElement(Spinner, { size: SpinnerSize.MD, theme: appearance === 'primary' || appearance === 'secondary' ? 'light' : 'dark' })) : (React.createElement(React.Fragment, null,
            Icon ? React.createElement(Icon, { className: iconClasses }) : null,
            children ? React.createElement("div", { className: bem.element('content'), style: contentStyle }, children) : null,
            tag ? React.createElement("div", { className: bem.element('tag') }, tag) : null)))));
});
WebButton.displayName = 'Button';
export default WebButton;
//# sourceMappingURL=WebButton.js.map