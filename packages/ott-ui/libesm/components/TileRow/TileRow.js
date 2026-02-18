import classNames from 'classnames';
import React, { useRef, memo } from 'react';
import './TileRow.scss';
import { useTransitionEvent } from '../../hooks/useTransitionEvent';
var TileRow = memo(function (_a) {
    var _b = _a.noTranslate, noTranslate = _b === void 0 ? false : _b, className = _a.className, children = _a.children, translateStyle = _a.translateStyle, enableLargerPoster = _a.enableLargerPoster, isPromoContent = _a.isPromoContent, isActive = _a.isActive, isSpotlight = _a.isSpotlight, onTransitionStart = _a.onTransitionStart, onTransitionEnd = _a.onTransitionEnd, onTransitionCancel = _a.onTransitionCancel;
    var ref = useRef(null);
    useTransitionEvent(ref, onTransitionStart, onTransitionEnd, onTransitionCancel);
    return (React.createElement("div", { ref: ref, "data-test-id": "tileRow", className: classNames('ott-tile-row', className, {
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