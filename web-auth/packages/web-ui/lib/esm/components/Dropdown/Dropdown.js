import { Alert, ArrowheadDown } from '@tubitv/icons';
import classnames from 'classnames';
import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import useOnClickOutside from '../../hooks/useOnClickOutside';
var DROPDOWN_OPTION_HEIGHT = 56;
var Dropdown = function (_a) {
    var className = _a.className, label = _a.label, defaultOption = _a.defaultOption, options = _a.options, onSelect = _a.onSelect, error = _a.error, name = _a.name, renderOption = _a.renderOption;
    var _b = useState(defaultOption === null || defaultOption === void 0 ? void 0 : defaultOption.value), selectedValue = _b[0], setSelectedValue = _b[1];
    var _c = useState(false), open = _c[0], setOpen = _c[1];
    var ref = useRef(null);
    var optionsRef = useRef(null);
    var selectedOption = options.find(function (item) { return item.value === selectedValue; });
    var selectedOptionIndex = options.findIndex(function (item) { return item.value === selectedValue; });
    var _d = useState(selectedOptionIndex), highlightIndex = _d[0], setHighlightIndex = _d[1];
    var handleOptionSelect = useCallback(function (option) {
        setSelectedValue(option.value);
        setOpen(false);
        onSelect === null || onSelect === void 0 ? void 0 : onSelect(option);
    }, [onSelect]);
    var scrollToIndex = useCallback(function (index) {
        if (open) {
            if (optionsRef.current) {
                optionsRef.current.scrollTop = DROPDOWN_OPTION_HEIGHT * (index - 1);
            }
        }
    }, [open]);
    var handleKeyDown = useCallback(function (event) {
        event.preventDefault();
        switch (event.key) {
            case 'Enter':
            case ' ': /* space bar */ {
                if (options[highlightIndex]) {
                    handleOptionSelect(options[highlightIndex]);
                }
                break;
            }
            case 'ArrowUp': {
                var newIndex = highlightIndex - 1;
                if (newIndex >= 0) {
                    setHighlightIndex(newIndex);
                    scrollToIndex(newIndex);
                }
                break;
            }
            case 'ArrowDown': {
                var newIndex = highlightIndex + 1;
                if (newIndex < options.length) {
                    setHighlightIndex(newIndex);
                    scrollToIndex(newIndex);
                }
                break;
            }
            case 'Escape': {
                setOpen(false);
                break;
            }
            default: {
                break;
            }
        }
    }, [options, highlightIndex, handleOptionSelect, scrollToIndex]);
    var handleInputClick = useCallback(function () {
        setOpen(!open);
    }, [open]);
    var handleInputKeyDown = useCallback(function (event) {
        switch (event.key) {
            case 'Enter': {
                handleInputClick();
                break;
            }
            default: {
                break;
            }
        }
    }, [handleInputClick]);
    useEffect(function () {
        if (open) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return function () {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, highlightIndex, options, handleKeyDown]);
    useEffect(function () {
        scrollToIndex(selectedOptionIndex);
        if (!open) {
            setHighlightIndex(selectedOptionIndex);
        }
    }, [open, scrollToIndex, selectedOptionIndex]);
    useOnClickOutside(ref, function () { return setOpen(false); });
    var containerClass = classnames('web-dropdown', {
        'web-dropdown__open': open,
        'web-dropdown__error': !!error,
    });
    var inputClass = classnames('web-dropdown--input', className);
    var arrowIconClass = classnames('web-dropdown--arrow-icon', {
        'web-dropdown--arrow-icon__open': open,
    });
    var labelClasses = classnames('web-dropdown--label', {
        'web-dropdown--label--small': !!selectedOption,
    });
    var inputTextClasses = classnames('web-dropdown--input-text', {
        'web-dropdown--input-text--with-label': !!label,
    });
    var optionsClasses = classnames('web-dropdown--options', {
        'web-dropdown--options__scrollable': options.length > 4,
    });
    var genId = function (id) { return [id, name].filter(Boolean).join('-'); };
    var labelId = genId('web-dropdown-label');
    var optionsId = genId('web-dropdown-options');
    return (React.createElement("div", { className: "web-dropdown--container" },
        open ? React.createElement("div", { className: "web-dropdown--placeholder" }) : null,
        React.createElement("div", { className: containerClass, ref: ref },
            React.createElement("div", { className: inputClass, onClick: handleInputClick, onKeyDown: handleInputKeyDown, tabIndex: 0, role: "combobox", "aria-controls": optionsId, "aria-expanded": open, "aria-activedescendant": "web-dropdown-option-".concat(highlightIndex), "aria-labelledby": label ? labelId : undefined },
                label ? (React.createElement("label", { id: labelId, className: labelClasses }, label)) : null,
                React.createElement("span", { className: inputTextClasses }, selectedOption === null || selectedOption === void 0 ? void 0 : selectedOption.label),
                React.createElement(ArrowheadDown, { className: arrowIconClass })),
            React.createElement("ul", { id: optionsId, role: "listbox", className: optionsClasses, tabIndex: -1, style: { display: open ? 'block' : 'none' }, ref: optionsRef }, options.map(function (option, index) { return (React.createElement("li", { key: option.value, id: "web-dropdown-option-".concat(index), role: "option", className: classnames('web-dropdown--option', {
                    'web-dropdown--option__selected': option.value === selectedValue || index === highlightIndex,
                }), tabIndex: -1, onClick: function () { return handleOptionSelect(option); }, "aria-selected": selectedValue === option.value }, renderOption ? renderOption(option, options) : option.label)); })),
            error ? (React.createElement("div", { className: "web-dropdown--error" },
                React.createElement(Alert, null),
                error)) : null)));
};
export default memo(Dropdown);
//# sourceMappingURL=Dropdown.js.map