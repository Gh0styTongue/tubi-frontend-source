import { CheckmarkStroke } from '@tubitv/icons';
import React, { useRef, useCallback, useEffect } from 'react';
import { defineMessages, useIntl } from 'react-intl';
var messages = defineMessages({
    selected: {
        id: 'optionList.selected',
        description: 'Screen reader text indicating an option is selected',
        defaultMessage: 'selected',
    },
});
var OptionListItem = React.memo(function (_a) {
    var option = _a.option, idx = _a.idx, activeIdx = _a.activeIdx, focusedIdx = _a.focusedIdx, totalOptions = _a.totalOptions, onOptionSelect = _a.onOptionSelect, onFocusChange = _a.onFocusChange;
    var intl = useIntl();
    var active = activeIdx === idx;
    var focused = focusedIdx === idx;
    var className = "".concat(active ? 'active' : '').concat(focused ? ' focused' : '').trim();
    var buttonRef = useRef(null);
    var handleClick = useCallback(function () {
        if (idx === activeIdx)
            return;
        if (onOptionSelect)
            onOptionSelect(idx);
    }, [idx, activeIdx, onOptionSelect]);
    var handleFocus = useCallback(function () {
        onFocusChange(idx);
    }, [idx, onFocusChange]);
    return (React.createElement("li", { id: "option-".concat(idx), "data-index": idx, className: className, role: "option", "aria-selected": active ? 'true' : 'false', "aria-setsize": totalOptions, "aria-posinset": idx + 1 },
        React.createElement("button", { ref: buttonRef, onClick: handleClick, onFocus: handleFocus, tabIndex: -1 },
            active ? React.createElement(CheckmarkStroke, { className: "checkmark", "aria-hidden": "true" }) : null,
            option.label,
            active && React.createElement("span", { className: "sr-only" }, intl.formatMessage(messages.selected)))));
});
var OptionList = function (_a) {
    var options = _a.options, activeLabel = _a.activeLabel, onOptionSelect = _a.onOptionSelect, ariaLabel = _a["aria-label"], ariaLabelledBy = _a["aria-labelledby"];
    var _b = React.useState(0), focusedIdx = _b[0], setFocusedIdx = _b[1];
    var listRef = useRef(null);
    var activeIdx = options.findIndex(function (opt) { return opt.label === activeLabel; });
    // Reset focused index when active label changes
    useEffect(function () {
        setFocusedIdx(activeIdx >= 0 ? activeIdx : 0);
    }, [activeIdx]);
    useEffect(function () {
        if (listRef.current) {
            listRef.current.focus();
        }
    }, []);
    var handleKeyDown = useCallback(function (event) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                setFocusedIdx(function (prev) { return Math.min(prev + 1, options.length - 1); });
                break;
            case 'ArrowUp':
                event.preventDefault();
                setFocusedIdx(function (prev) { return Math.max(prev - 1, 0); });
                break;
            case 'Home':
                event.preventDefault();
                setFocusedIdx(0);
                break;
            case 'End':
                event.preventDefault();
                setFocusedIdx(options.length - 1);
                break;
            case 'Enter':
            case ' ':
                event.preventDefault();
                if (focusedIdx !== activeIdx && onOptionSelect) {
                    onOptionSelect(focusedIdx);
                }
                break;
            case 'Escape':
                event.preventDefault();
                // Focus the trigger element or parent if available
                var activeElement = document.activeElement;
                if (activeElement) {
                    var trigger = activeElement.closest('[role="button"], [role="menuitem"]');
                    if (trigger instanceof HTMLElement) {
                        trigger.focus();
                    }
                }
                break;
            default:
                // Allow other keys to pass through
                break;
        }
    }, [options.length, focusedIdx, activeIdx, onOptionSelect]);
    var handleFocusChange = useCallback(function (idx) {
        setFocusedIdx(idx);
    }, []);
    return (React.createElement(React.Fragment, null,
        React.createElement("ul", { ref: listRef, className: "option-list", role: "listbox", "aria-label": ariaLabel, "aria-labelledby": ariaLabelledBy, "aria-activedescendant": "option-".concat(focusedIdx), onKeyDown: handleKeyDown, tabIndex: 0, "aria-multiselectable": "false" }, options.map(function (option, idx) { return (React.createElement(OptionListItem, { key: option.label, option: option, idx: idx, activeIdx: activeIdx, focusedIdx: focusedIdx, totalOptions: options.length, onOptionSelect: onOptionSelect, onFocusChange: handleFocusChange })); }))));
};
export default OptionList;
//# sourceMappingURL=OptionList.js.map