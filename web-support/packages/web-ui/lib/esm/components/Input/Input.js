import { __assign, __rest } from "tslib";
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import { Hide, Reveal } from '../Icons/Icons';
/**
 * Input Field, including `input`, `textarea` and `select`
 */
var Input = React.memo(function (props) {
    var _a = props.tag, Tag = _a === void 0 ? 'input' : _a, _b = props.type, type = _b === void 0 ? 'text' : _b, label = props.label, hint = props.hint, maxLength = props.maxLength, className = props.className, _c = props.canPasswordVisible, canPasswordVisible = _c === void 0 ? true : _c, fixedLabel = props.fixedLabel, disabled = props.disabled, _d = props.showCounter, showCounter = _d === void 0 ? true : _d, value = props.value, error = props.error, name = props.name, onFocus = props.onFocus, onBlur = props.onBlur, onChange = props.onChange, others = __rest(props, ["tag", "type", "label", "hint", "maxLength", "className", "canPasswordVisible", "fixedLabel", "disabled", "showCounter", "value", "error", "name", "onFocus", "onBlur", "onChange"]);
    var _e = useState(false), active = _e[0], setActive = _e[1];
    var _f = useState(false), passwordVisible = _f[0], setPasswordVisible = _f[1];
    var handleFocus = useCallback(function (e) {
        if (onFocus)
            onFocus(e);
        setActive(true);
    }, [onFocus]);
    var handleBlur = useCallback(function (e) {
        if (onBlur)
            onBlur(e);
        setActive(false);
    }, [onBlur]);
    var handleChange = useCallback(function (e) {
        if (onChange)
            onChange(e);
        setActive(true);
    }, [onChange]);
    var togglePasswordVisible = useCallback(function () {
        setPasswordVisible(function (currState) { return !currState; });
    }, []);
    var finalType = type === 'password' && canPasswordVisible && passwordVisible
        ? 'text'
        : type;
    var classes = classNames('Input', {
        'Input--disabled': disabled,
        'Input--activated': active,
        'Input--fixed': fixedLabel,
        'Input--errored': error,
        'Input--filled': value,
        'Input--textarea': Tag === 'textarea',
    }, className);
    var passwordIcon = null;
    if (type === 'password' && canPasswordVisible && value) {
        passwordIcon = passwordVisible ? (React.createElement(Hide
        // eslint-disable-next-line react/forbid-component-props
        , { 
            // eslint-disable-next-line react/forbid-component-props
            className: "Input__password-icon", onClick: togglePasswordVisible })) : (React.createElement(Reveal
        // eslint-disable-next-line react/forbid-component-props
        , { 
            // eslint-disable-next-line react/forbid-component-props
            className: "Input__password-icon", onClick: togglePasswordVisible }));
    }
    return (React.createElement("div", { className: classes },
        React.createElement(Tag
        // eslint-disable-next-line react/forbid-component-props
        , __assign({ 
            // eslint-disable-next-line react/forbid-component-props
            className: "Input__input", name: name, type: finalType, value: value, maxLength: maxLength, disabled: disabled }, others, { onFocus: handleFocus, onBlur: handleBlur, onChange: handleChange })),
        error || label ? (React.createElement("span", { className: "Input__label" }, error || label)) : null,
        maxLength && showCounter && value ? (React.createElement("span", { className: "Input__counter" },
            value.length,
            "/",
            maxLength)) : null,
        hint ? React.createElement("span", { className: "Input__hint" }, hint) : null,
        passwordIcon));
});
Input.displayName = 'Input';
export default Input;
//# sourceMappingURL=Input.js.map