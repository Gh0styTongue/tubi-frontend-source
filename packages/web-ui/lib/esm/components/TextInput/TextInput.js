import { __assign, __rest } from "tslib";
import { Checkmark, Hide, Show } from '@tubitv/icons';
import classnames from 'classnames';
import React, { memo, forwardRef, useCallback, useState, useRef } from 'react';
import useCombinedRefs from '../../hooks/useCombinedRefs';
var TextInput = forwardRef(function (_a, userRef) {
    var canShowPassword = _a.canShowPassword, enablePasswordToggle = _a.enablePasswordToggle, className = _a.className, containerClass = _a.containerClass, error = _a.error, icon = _a.icon, iconClass = _a.iconClass, label = _a.label, onBlur = _a.onBlur, onChange = _a.onChange, onFocus = _a.onFocus, name = _a.name, placeholder = _a.placeholder, type = _a.type, validated = _a.validated, value = _a.value, otherProps = __rest(_a, ["canShowPassword", "enablePasswordToggle", "className", "containerClass", "error", "icon", "iconClass", "label", "onBlur", "onChange", "onFocus", "name", "placeholder", "type", "validated", "value"]);
    var innerRef = useRef(null);
    var ref = useCombinedRefs(userRef, innerRef);
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
        'web-text-input__input--filled': !!value,
    });
    var iconClasses = classnames(iconClass, 'web-text-input__icon');
    var placeholderClasses = classnames('web-text-input__placeholder', {
        'web-text-input__placeholder--show': active && !value,
    });
    var inputElementId = 'text-input';
    if (name)
        inputElementId += "-".concat(name);
    // Use provided id prop if available, otherwise use generated inputElementId
    var finalInputId = otherProps.id || inputElementId;
    var errorElementId = "error-".concat(finalInputId);
    var _c = useState(false), passwordVisible = _c[0], setPasswordVisible = _c[1];
    var togglePasswordVisible = useCallback(function () { return setPasswordVisible(function (val) { return !val; }); }, []);
    var finalType = type;
    var togglePasswordButton = null;
    if ((type === 'password' || enablePasswordToggle) && canShowPassword) {
        if (passwordVisible)
            finalType = 'text';
        if (value) {
            var PasswordIcon = passwordVisible ? Hide : Show;
            var label_1 = passwordVisible ? 'Hide password' : 'Show password';
            togglePasswordButton = (React.createElement("button", { type: "button", className: "web-text-input__toggle-password-button", onClick: togglePasswordVisible, "aria-label": label_1 },
                React.createElement(PasswordIcon, { className: classnames('web-text-input__password-icon', {
                        'web-text-input__password-icon--hide': passwordVisible,
                    }) })));
        }
    }
    return (React.createElement("div", { className: containerClasses },
        React.createElement("label", { htmlFor: finalInputId, className: labelClasses }, label),
        React.createElement("input", __assign({ id: finalInputId, name: name, type: finalType, ref: ref, className: inputClasses, onBlur: handleBlur, onChange: onChange, onFocus: handleFocus, value: value, "aria-invalid": error ? 'true' : undefined, "aria-describedby": error ? errorElementId : undefined }, otherProps)),
        error && (React.createElement("div", { id: errorElementId, className: "web-text-input__error" }, error)),
        icon ? React.createElement("span", { className: iconClasses, "aria-hidden": "true" }, icon) : null,
        placeholder ? React.createElement("span", { className: placeholderClasses }, placeholder) : null,
        validated ? React.createElement(Checkmark, { className: "web-text-input__validated-icon", "aria-hidden": "true" }) : null,
        togglePasswordButton));
});
TextInput.displayName = 'TextInput';
export default memo(TextInput);
//# sourceMappingURL=TextInput.js.map