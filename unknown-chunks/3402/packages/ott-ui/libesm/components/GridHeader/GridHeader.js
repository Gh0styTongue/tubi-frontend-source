import classNames from 'classnames';
import React, { useMemo } from 'react';
import Label from '../Label/Label';
import './GridHeader.scss';
var GridHeader = function (_a) {
    var title = _a.title, cls = _a.cls, labelText = _a.labelText, _b = _a.labelPosition, labelPosition = _b === void 0 ? 'left' : _b;
    var labelCls = classNames('ott-grid-header__label', {
        'ott-grid-header__label--right': labelPosition === 'right',
    });
    var label = useMemo(function () {
        return labelText && (React.createElement(Label, { className: labelCls, design: "primary-outline" }, labelText));
    }, [labelText, labelCls]);
    return (React.createElement("div", { "data-test-id": "ott-ui-grid-header", className: cls, "data-component": "GridHeader" },
        labelPosition === 'left' ? label : title,
        labelPosition === 'left' ? title : label));
};
GridHeader.displayName = 'GridHeader';
export default GridHeader;
//# sourceMappingURL=GridHeader.js.map