import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React from 'react';
import omitInvalidProps from '../../omitInvalidProps';
import './SvgIcon.scss';
/**
 * @deprecated Use `@tubitv/icons` instead.
 * Encapsulates an SVG icon and gives us some convenience methods to play around. A typical usage can look like this:
 * ```
 * <SvgIcon className={styles.close} fill="gray" viewBox="0 0 40 40" role='img'><title>Svg Icon</title>
 *   <g><path d="M19 6.41l-1.41-1.41-..."></path></g>
 * </SvgIcon>
 * ```
 */
var SvgIcon = function (_a) {
    var children = _a.children, _b = _a.fill, fill = _b === void 0 ? 'currentColor' : _b, className = _a.className, style = _a.style, _c = _a.viewBox, viewBox = _c === void 0 ? '0 0 24 24' : _c, _d = _a.role, role = _d === void 0 ? 'img' : _d, attributes = __rest(_a, ["children", "fill", "className", "style", "viewBox", "role"]);
    var mergedClassName = classNames('ott-svg-icon', className);
    return (React.createElement("svg", __assign({ className: mergedClassName, preserveAspectRatio: "xMidYMid meet", style: style, fill: fill, role: role, viewBox: viewBox }, omitInvalidProps(attributes)), children));
};
SvgIcon.displayName = 'SvgIcon';
export default SvgIcon;
//# sourceMappingURL=SvgIcon.js.map