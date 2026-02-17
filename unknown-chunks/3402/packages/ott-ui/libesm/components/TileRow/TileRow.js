import classNames from 'classnames';
import React from 'react';
import './TileRow.scss';
var TileRow = React.memo(function (_a) {
    var _b = _a.noTranslate, noTranslate = _b === void 0 ? false : _b, className = _a.className, children = _a.children, translateStyle = _a.translateStyle, enableLargerPoster = _a.enableLargerPoster, isPromoContent = _a.isPromoContent, isActive = _a.isActive, isSpotlight = _a.isSpotlight;
    return (React.createElement("div", { "data-test-id": "tileRow", className: classNames('ott-tile-row', className, {
            'ott-tile-row__no-translate': noTranslate,
            'ott-tile-row__larger': enableLargerPoster,
            'ott-tile-row__promo-content': isPromoContent,
            'ott-tile-row__spotlight': isSpotlight,
            'active': isActive,
        }), style: noTranslate ? undefined : translateStyle }, children));
});
TileRow.displayName = 'TileRow';
export default TileRow;
//# sourceMappingURL=TileRow.js.map