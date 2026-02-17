import { __assign } from "tslib";
import { CheckmarkStroke } from '@tubitv/icons';
import React from 'react';
var OptionListItem = React.memo(function (_a) {
    var option = _a.option, idx = _a.idx, activeIdx = _a.activeIdx, onOptionSelect = _a.onOptionSelect;
    var active = activeIdx === idx;
    var className = active ? 'active' : '';
    var handleClick = React.useCallback(function () {
        if (idx === activeIdx)
            return;
        if (onOptionSelect)
            onOptionSelect(idx);
    }, [idx, activeIdx, onOptionSelect]);
    return (React.createElement("li", { "data-index": idx, className: className, onClick: handleClick },
        React.createElement("button", null,
            active ? React.createElement(CheckmarkStroke, { className: "checkmark" }) : null,
            option.label)));
});
var OptionList = function (_a) {
    var options = _a.options, activeLabel = _a.activeLabel, onOptionSelect = _a.onOptionSelect;
    var activeIdx = options.findIndex(function (opt) { return opt.label === activeLabel; });
    return (React.createElement("ul", { className: "option-list" }, options.map(function (option, idx) { return (React.createElement(OptionListItem, __assign({ key: option.label }, { option: option, idx: idx, activeIdx: activeIdx, onOptionSelect: onOptionSelect }))); })));
};
export default OptionList;
//# sourceMappingURL=OptionList.js.map