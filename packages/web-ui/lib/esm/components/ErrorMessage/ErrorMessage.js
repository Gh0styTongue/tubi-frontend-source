import { __assign, __rest } from "tslib";
import { Alert } from '@tubitv/icons';
import classNames from 'classnames';
import React from 'react';
var ErrorMessage = function (_a) {
    var className = _a.className, message = _a.message, otherProps = __rest(_a, ["className", "message"]);
    if (!message)
        return null;
    var containerClasses = classNames(['web-error-message', className]);
    return (React.createElement("div", __assign({ className: containerClasses, role: "alert", "aria-live": "assertive", "aria-atomic": "true" }, otherProps),
        React.createElement("div", { className: "web-error-message__icon-container" },
            React.createElement(Alert, { className: "web-error-message__icon" })),
        React.createElement("p", { className: "web-error-message__text" }, message)));
};
export default ErrorMessage;
//# sourceMappingURL=ErrorMessage.js.map