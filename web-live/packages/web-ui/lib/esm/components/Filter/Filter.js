import classNames from 'classnames';
import React, { memo, useCallback } from 'react';
var Filter = function (_a) {
    var items = _a.items, selectedIds = _a.selectedIds, onSelected = _a.onSelected;
    var onKeyDown = useCallback(function (event, item) {
        if (event.key === 'Enter') {
            onSelected === null || onSelected === void 0 ? void 0 : onSelected(item);
        }
    }, [onSelected]);
    if (items.length <= 1) {
        return null;
    }
    return (React.createElement("div", { "data-test-id": "web-ui-filter", className: "web-filter" }, items.map(function (item) { return (React.createElement("span", { className: classNames('web-filter__item', {
            'web-filter__item--selected': selectedIds.includes(item.id),
        }), key: item.id, onClick: function () { return onSelected === null || onSelected === void 0 ? void 0 : onSelected(item); }, 
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex: 0, onKeyDown: function (event) { return onKeyDown(event, item); } }, item.content)); })));
};
export default memo(Filter);
//# sourceMappingURL=Filter.js.map