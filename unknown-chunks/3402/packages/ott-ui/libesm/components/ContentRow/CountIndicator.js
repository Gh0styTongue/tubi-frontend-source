import React from 'react';
/**
 * Displays current content index (1-based) and total available contents
 * @param {Number} activeNumber active 1-based-index in the row
 * @param {Number} totalNumber total number of available contents
 */
var CountIndicator = function (_a) {
    var activeNumber = _a.activeNumber, totalNumber = _a.totalNumber;
    return (React.createElement("div", { "data-test-id": "ott-ui-count-indicator", className: "ott-content-row-wrapper__count-indicator" },
        React.createElement("span", { className: "ott-content-row-wrapper__count-indicator__active-number", "data-test-id": "activeRowCountIdx" }, activeNumber),
        " \u00B7 ",
        React.createElement("span", { "data-test-id": "totalTilesInRow" }, totalNumber)));
};
CountIndicator.displayName = 'CountIndicator';
export default CountIndicator;
//# sourceMappingURL=CountIndicator.js.map