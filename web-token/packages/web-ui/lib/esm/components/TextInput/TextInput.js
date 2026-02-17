import { __assign, __rest } from "tslib";
import { Alert, Checkmark, Hide, Show } from '@tubitv/icons';
import classnames from 'classnames';
import React, { memo, forwardRef, useCallback, useState, useRef } from 'react';
import useCombinedRefs from '../../hooks/useCombinedRefs';
var TextInput = forwardRef(function (_a, userRef) {
    var canShowPassword = _a.canShowPassword, className = _a.className, containerClass = _a.containerClass, error = _a.error, icon = _a.icon, iconClass = _a.iconClass, label = _a.label, onBlur = _a.onBlur, onChange = _a.onChange, onFocus = _a.onFocus, name = _a.name, placeholder = _a.placeholder, type = _a.type, validated = _a.validated, value = _a.value, otherProps = __rest(_a, ["canShowPassword", "className", "containerClass", "error", "icon", "iconClass", "label", "onBlur", "onChange", "onFocus", "name", "placeholder", "type", "validated", "value"]);
    var innerRef = useRef(null);
    var ref = useCombinedRefs(userRef, innerRef);
    var onContainerClick = function () { var _a; return (_a = ref.current) === null || _a === void 0 ? void 0 : _a.focus(); };
    var _b = useState(false), active = _b[0], setActive = _b[1];
    var handleBlur = function (e) {
        setActive(false);
        if (onBlur)
            onBlur(e);
    };
    var handleFocus = function (e) {
        setActive(true);
        if (onFocus)
            onFocus(e);
    };
    var labelClasses = classnames('web-text-input__label', {
        'web-text-input__label--small': !!value,
    });
    var containerClasses = classnames('web-text-input', containerClass, {
        'web-text-input--error': !!error,
    });
    var inputClasses = classnames('web-text-input__input', className, {
        'web-text-input__input--with-icon': !!icon,
    });
    var iconClasses = classnames(iconClass, 'web-text-input__icon');
    var placeholderClasses = classnames('web-text-input__placeholder', {
        'web-text-input__placeholder--show': active && !value,
    });
    var inputElementId = 'text-input';
    if (name)
        inputElementId += "-".concat(name);
    var errorElementId = "error-".concat(inputElementId);
    var _c = useState(false), passwordVisible = _c[0], setPasswordVisible = _c[1];
    var togglePasswordVisible = useCallback(function () { return setPasswordVisible(function (val) { return !val; }); }, []);
    var finalType = type;
    var togglePasswordButton = null;
    if (type === 'password' && canShowPassword) {
        if (passwordVisible)
            finalType = 'text';
        if (value) {
            var PasswordIcon = passwordVisible ? Hide : Show;
            var label_1 = passwordVisible ? 'Hide password' : 'Show password';
            togglePasswordButton = (React.createElement("button", { type: "button", className: "web-text-input__toggle-password-button", onClick: togglePasswordVisible, "aria-label": label_1 },
                React.createElement(PasswordIcon, { className: "web-text-input__password-icon" })));
        }
    }
    return (React.createElement("div", { className: containerClasses, onClick: onContainerClick },
        React.createElement("input", __assign({ id: inputElementId, "aria-describedby": errorElementId, name: name, type: finalType, ref: ref, className: inputClasses, onBlur: handleBlur, onChange: onChange, onFocus: handleFocus, value: value }, otherProps)),
        React.createElement("label", { htmlFor: inputElementId, className: labelClasses }, label),
        icon ? React.createElement("span", { className: iconClasses }, icon) : null,
        placeholder ? React.createElement("span", { className: placeholderClasses }, placeholder) : null,
        error ? (React.createElement("div", { id: errorElementId, className: "web-text-input__error" },
            React.createElement(Alert, null),
            error)) : null,
        validated ? React.createElement(Checkmark, { className: "web-text-input__validated-icon" }) : null,
        togglePasswordButton));
});
TextInput.displayName = 'TextInput';
export default memo(TextInput);
//# sourceMappingURL=TextInput.js.map