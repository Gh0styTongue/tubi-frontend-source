import classNames from 'classnames';
import React from 'react';
function Rating(_a) {
    var children = _a.children, className = _a.className, style = _a.style;
    var classes = classNames('web-rating', className);
    return (React.createElement("div", { className: classes, style: style },
        React.createElement("div", { className: "web-rating__content" }, children)));
}
export default Rating;
//# sourceMappingURL=Rating.js.map