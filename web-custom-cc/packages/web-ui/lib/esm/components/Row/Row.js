import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React, { forwardRef } from 'react';
var Row = forwardRef(function (_a, ref) {
    var _b = _a.tag, Tag = _b === void 0 ? 'div' : _b, noGutters = _a.noGutters, className = _a.className, children = _a.children, restProps = __rest(_a, ["tag", "noGutters", "className", "children"]);
    var classes = classNames('Row', { 'Row--no-gutters': noGutters }, className);
    // eslint-disable-next-line react/forbid-component-props
    return React.createElement(Tag, __assign({ className: classes, ref: ref }, restProps), children);
});
Row.displayName = 'Row';
export default Row;
//# sourceMappingURL=Row.js.map