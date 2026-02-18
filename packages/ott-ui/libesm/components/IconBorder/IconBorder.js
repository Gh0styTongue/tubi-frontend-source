import classNames from 'classnames';
import React from 'react';
import './IconBorder.scss';
var IconBorder = function (props) {
    var className = props.className, style = props.style, children = props.children;
    var mergedClassNames = classNames('ott-icon-border', className);
    return (React.createElement("div", { "data-test-id": "ott-ui-icon-border", className: mergedClassNames, style: style }, children));
};
IconBorder.displayName = 'IconBorder';
export default IconBorder;
//# sourceMappingURL=IconBorder.js.map