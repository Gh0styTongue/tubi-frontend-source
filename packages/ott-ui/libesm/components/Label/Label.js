import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React from 'react';
import omitInvalidProps from '../../omitInvalidProps';
import './Label.scss';
/**
 * Indicate important notes and highlight parts of your content.
 */
var Label = function (_a) {
    var children = _a.children, className = _a.className, style = _a.style, _b = _a.design, design = _b === void 0 ? 'primary' : _b, _c = _a.rounded, rounded = _c === void 0 ? true : _c, innerClassName = _a.innerClassName, _d = _a.size, size = _d === void 0 ? 'large-legacy' : _d, attributes = __rest(_a, ["children", "className", "style", "design", "rounded", "innerClassName", "size"]);
    var labelClass = classNames('ott-label', className, "ott-label--design-".concat(design), {
        'ott-label--rounded': rounded,
        'ott-label--compact': size === 'compact',
        'ott-label--compact-rounded': size === 'compact' && rounded,
    });
    var innerClass = classNames('ott-label--design-primary-outline__content', innerClassName);
    return (React.createElement("div", __assign({ className: labelClass, style: style }, omitInvalidProps(attributes)), design === 'primary-outline'
        ? React.createElement("div", { className: innerClass }, children)
        : children));
};
Label.displayName = 'Label';
export default Label;
//# sourceMappingURL=Label.js.map