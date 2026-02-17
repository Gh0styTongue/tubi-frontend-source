import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React, { forwardRef } from 'react';
var Column = forwardRef(function (_a, ref) {
    var _b = _a.tag, Tag = _b === void 0 ? 'div' : _b, className = _a.className, children = _a.children, restProps = __rest(_a, ["tag", "className", "children"]);
    var classes = classNames('Container', className);
    // @ts-expect-error: TS doesn't handle Tag being a string
    // eslint-disable-next-line react/forbid-component-props
    return React.createElement(Tag, __assign({ ref: ref, className: classes }, restProps), children);
});
Column.displayName = 'Column';
export default Column;
//# sourceMappingURL=Container.js.map