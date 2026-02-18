import { __assign } from "tslib";
import { Circle, CheckmarkCircleStroke } from '@tubitv/icons';
import classNames from 'classnames';
import React from 'react';
var Checkbox = function (_a) {
    var className = _a.className, checked = _a.checked, id = _a.id, _b = _a.inputProps, inputProps = _b === void 0 ? {} : _b, _c = _a.label, label = _c === void 0 ? '' : _c, onChange = _a.onChange, value = _a.value, inverted = _a.inverted, _d = _a.type, type = _d === void 0 ? 'checkbox' : _d, _e = _a.useDefaultIcon, useDefaultIcon = _e === void 0 ? false : _e, error = _a.error;
    var Icon = checked ? CheckmarkCircleStroke : Circle;
    var labelClass = classNames('web-checkbox__label', {
        'web-checkbox__label--checked': !!checked,
        'web-checkbox__label--inverted': inverted,
    });
    var iconClass = classNames('web-checkbox__icon', {
        'web-checkbox__icon--with-label-text': !!label,
        'web-checkbox__icon--use-default-icon': useDefaultIcon,
    });
    var inputClass = classNames('web-checkbox__input', {
        'web-checkbox__input--use-default-icon': useDefaultIcon,
        'web-checkbox__input--inverted': inverted,
        'web-checkbox__input--error': error,
    });
    var handleChange = function () {
        /* istanbul ignore next */
        if (onChange)
            onChange(id);
    };
    return (React.createElement("div", { className: classNames('web-checkbox', className) },
        React.createElement("label", { htmlFor: id, className: labelClass },
            React.createElement("input", __assign({ "data-test-id": "web-checkbox-".concat(id), checked: checked, className: inputClass, id: id, onChange: handleChange, type: type, value: value }, inputProps)),
            React.createElement(Icon, { className: iconClass }),
            error ? React.createElement("span", { className: "web-checkbox__error" }, error) : null,
            label)));
};
export default Checkbox;
//# sourceMappingURL=Checkbox.js.map