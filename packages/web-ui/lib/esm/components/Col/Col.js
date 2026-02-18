import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React, { forwardRef } from 'react';
import { BREAKPOINTS } from '../../constants/constants';
import { isUndefined, isObject } from '../../utils/tools';
var getColumnSizeClass = function (infix, colSize) {
    if (colSize === true) {
        return infix === '' ? '' : "Col-".concat(infix);
    }
    if (colSize === 'auto') {
        return "Col-".concat(infix, "-auto");
    }
    return "Col-".concat(infix, "-").concat(colSize);
};
var Col = forwardRef(function (_a, ref) {
    var _b = _a.tag, Tag = _b === void 0 ? 'div' : _b, _c = _a.widths, widths = _c === void 0 ? Object.keys(BREAKPOINTS) : _c, className = _a.className, children = _a.children, xs = _a.xs, sm = _a.sm, sMd = _a.sMd, md = _a.md, lg = _a.lg, xl = _a.xl, xxl = _a.xxl, restProps = __rest(_a, ["tag", "widths", "className", "children", "xs", "sm", "sMd", "md", "lg", "xl", "xxl"]);
    var attributes = { xs: xs, sm: sm, sMd: sMd, md: md, lg: lg, xl: xl, xxl: xxl };
    var colClasses = [];
    widths.forEach(function (colWidth) {
        var _a;
        var columnProp = attributes[colWidth];
        delete attributes[colWidth];
        if (!columnProp)
            return;
        var infix = colWidth === 'xs' ? '' : "-".concat(colWidth);
        var colClass;
        if (isObject(columnProp)) {
            colClass = getColumnSizeClass(infix, columnProp.size);
            colClasses.push(classNames((_a = {},
                _a[colClass] = columnProp.size,
                _a["Col-".concat(infix, "-push-").concat(columnProp.push)] = !isUndefined(columnProp.push),
                _a["Col-".concat(infix, "-pull-").concat(columnProp.pull)] = !isUndefined(columnProp.pull),
                _a["Col-".concat(infix, "-offset-").concat(columnProp.offset)] = !isUndefined(columnProp.offset),
                _a)));
        }
        else {
            colClass = getColumnSizeClass(infix, columnProp);
            colClasses.push(colClass);
        }
    });
    var classes = classNames('Col', colClasses, className);
    // eslint-disable-next-line react/forbid-component-props
    return React.createElement(Tag, __assign({ className: classes, ref: ref }, restProps), children);
});
Col.displayName = 'Col';
export default Col;
//# sourceMappingURL=Col.js.map