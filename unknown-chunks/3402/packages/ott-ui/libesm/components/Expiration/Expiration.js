import classNames from 'classnames';
import React from 'react';
import './Expiration.scss';
var Expiration = function (_a) {
    var className = _a.className, children = _a.children, style = _a.style, days = _a.days;
    var isNearExpiration = days > 0 && days <= 14;
    if (isNearExpiration) {
        var expirationClassName = classNames('ott-expiration', className);
        return (React.createElement("div", { className: expirationClassName, style: style }, children));
    }
    return null;
};
Expiration.displayName = 'Expiration';
export default Expiration;
//# sourceMappingURL=Expiration.js.map