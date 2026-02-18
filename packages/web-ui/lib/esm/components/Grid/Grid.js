import { __assign, __rest } from "tslib";
import classnames from 'classnames';
import React, { forwardRef, memo } from 'react';
var isObject = function (value) {
    return value != null && typeof value === 'object' && Array.isArray(value) === false;
};
var BREAKPOINTS = ['xs', 'sm', 'sMd', 'md', 'lg', 'xl', 'xxl'];
var GridContainer = forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, _b = _a.as, Tag = _b === void 0 ? 'div' : _b, _c = _a.includeMargin, includeMargin = _c === void 0 ? true : _c, otherProps = __rest(_a, ["className", "children", "as", "includeMargin"]);
    var combinedClassname = classnames('web-grid-container', {
        'web-grid-container--no-margin': !includeMargin,
    }, className);
    return (React.createElement(Tag, __assign({ "data-test-id": "web-ui-grid-container", ref: ref, className: combinedClassname }, otherProps), children));
});
GridContainer.displayName = 'GridContainer';
var getColumnSizeClass = function (infix, colSize) {
    if (colSize === true) {
        return infix === '' ? '' : "web-col-".concat(infix);
    }
    if (colSize === 'auto') {
        return "web-col-".concat(infix, "-auto");
    }
    return "web-col-".concat(infix, "-").concat(colSize);
};
var GridItem = forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, _b = _a.as, Tag = _b === void 0 ? 'div' : _b, otherProps = __rest(_a, ["className", "children", "as"]);
    var colClasses = [];
    BREAKPOINTS.forEach(function (colWidth) {
        var _a;
        var columnProp = otherProps[colWidth];
        delete otherProps[colWidth];
        if (!columnProp)
            return;
        var infix = colWidth === 'xs' ? '' : "-".concat(colWidth);
        var colClass;
        if (isObject(columnProp)) {
            colClass = getColumnSizeClass(infix, columnProp.size);
            colClasses.push(classnames((_a = {},
                _a[colClass] = columnProp.size,
                _a["web-col-".concat(infix, "-push-").concat(columnProp.push)] = typeof columnProp.push !== 'undefined',
                _a["web-col-".concat(infix, "-pull-").concat(columnProp.pull)] = typeof columnProp.pull !== 'undefined',
                _a["web-col-".concat(infix, "-offset-").concat(columnProp.offset)] = typeof columnProp.offset !== 'undefined',
                _a)));
        }
        else {
            colClass = getColumnSizeClass(infix, columnProp);
            colClasses.push(colClass);
        }
    });
    var combinedClassname = classnames('web-col', colClasses, className);
    return (React.createElement(Tag, __assign({ "data-test-id": "web-ui-grid-item", ref: ref, className: combinedClassname }, otherProps), children));
});
GridItem.displayName = 'GridItem';
var Grid = {
    Container: memo(GridContainer),
    Item: memo(GridItem),
};
export default Grid;
//# sourceMappingURL=Grid.js.map